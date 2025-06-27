import mongoose, { isValidObjectId } from "mongoose";
import { getIo } from "../config/socketio.js";
import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import Notification from "../models/notification.model.js";
import { AppError } from "./apperror.js";
import User from "../models/user.model.js";

const getSort = (sortBy) => {
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-low": { price: 1 },
    "price-high": { price: -1 },
    "rating-high": { "rating.averageRating": -1 },
    "rating-low": { "rating.averageRating": 1 },
    popular: { enrolledCount: -1 },
    "title-asc": { title: 1 },
    "title-desc": { title: -1 },
    relevance: { score: { $meta: "textScore" } },
  };
  return sortOptions[sortBy] || { createdAt: -1 };
};

export const hasAccess = async (courseId, userId, userRole) => {
  const course = await Course.findById(courseId)
    .select("instructor") // only fetch what you need
    .lean();

  if (!course) throw new AppError("Course not found!", 404);

  // Grant access if the user is an admin
  if (userRole === "admin") return true;

  // Grant access if the user is the course instructor
  if (course.instructor.toString() === userId) return true;

  // Grant access if the user has purchased the course
  const isEnrolled = await Enrollment.exists({
    user: userId,
    course: courseId,
  });
  return !!isEnrolled;
};

export const generateNotification = async (sender, receiver, message, type) => {
  const notification = new Notification({
    sender,
    receiver,
    message,
    type,
    isRead: false,
  });

  await notification.save();

  // Emit to user's personal socket room
  getIo().to(receiver).emit("new_notification", {
    _id: notification._id,
    message,
    type,
    createdAt: notification.createdAt,
  });
};

// Build aggregation pipeline for single course with offers

export function buildSingleCoursePipeline(courseId, hasUserAccess) {
  const pipeline = [];

  // 1. Match the specific course
  pipeline.push({
    $match: { _id: new mongoose.Types.ObjectId(courseId) }
  });

  // 2. Lookup offers - fetch all applicable offers
  pipeline.push({
    $lookup: {
      from: "offers",
      let: { 
        courseId: "$_id", 
        categoryIds: "$category", 
        instructorId: "$instructor" 
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                // Only active offers within date range
                { $eq: ["$status", "active"] },
                { $lte: ["$startDate", new Date()] },
                { $gte: ["$endDate", new Date()] },
                {
                  $or: [
                    // Global offers
                    { $eq: ["$type", "global"] },
                    // First-time user offers
                    { $eq: ["$type", "first-time"] },
                    // Course-specific offers
                    {
                      $and: [
                        { $eq: ["$type", "course"] },
                        {
                          $in: [
                            "$$courseId",
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$applicableTo",
                                    cond: { $eq: ["$$this.refModel", "Course"] }
                                  }
                                },
                                as: "item",
                                in: "$$item.refId"
                              }
                            }
                          ]
                        }
                      ]
                    },
                    // Category offers
                    {
                      $and: [
                        { $eq: ["$type", "category"] },
                        {
                          $gt: [
                            {
                              $size: {
                                $setIntersection: [
                                  "$$categoryIds",
                                  {
                                    $map: {
                                      input: {
                                        $filter: {
                                          input: "$applicableTo",
                                          cond: { $eq: ["$$this.refModel", "Category"] }
                                        }
                                      },
                                      as: "item",
                                      in: "$$item.refId"
                                    }
                                  }
                                ]
                              }
                            },
                            0
                          ]
                        }
                      ]
                    },
                    // Instructor offers
                    {
                      $and: [
                        { $eq: ["$type", "instructor"] },
                        {
                          $in: [
                            "$$instructorId",
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$applicableTo",
                                    cond: { $eq: ["$$this.refModel", "Instructor"] }
                                  }
                                },
                                as: "item",
                                in: "$$item.refId"
                              }
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            name: 1,
            type: 1,
            discountType: 1,
            discountValue: 1
          }
        }
      ],
      as: "applicableOffers"
    }
  });

  // 3. Find best offer (highest discount)
  pipeline.push({
    $addFields: {
      bestOfferData: {
        $reduce: {
          input: "$applicableOffers",
          initialValue: null,
          in: {
            $cond: {
              if: { $eq: ["$$value", null] },
              then: "$$this",
              else: {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $cond: {
                          if: { $eq: ["$$this.discountType", "percentage"] },
                          then: "$$this.discountValue",
                          else: {
                            $cond: {
                              if: { $gt: ["$price", 0] },
                              then: { $multiply: [{ $divide: ["$$this.discountValue", "$price"] }, 100] },
                              else: 0
                            }
                          }
                        }
                      },
                      {
                        $cond: {
                          if: { $eq: ["$$value.discountType", "percentage"] },
                          then: "$$value.discountValue",
                          else: {
                            $cond: {
                              if: { $gt: ["$price", 0] },
                              then: { $multiply: [{ $divide: ["$$value.discountValue", "$price"] }, 100] },
                              else: 0
                            }
                          }
                        }
                      }
                    ]
                  },
                  then: "$$this",
                  else: "$$value"
                }
              }
            }
          }
        }
      }
    }
  });

  // 4. Calculate pricing and offer details
  pipeline.push({
    $addFields: {
      // Calculate effective price (final price after discount)
      effectivePrice: {
        $cond: {
          if: { $ne: ["$bestOfferData", null] },
          then: {
            $cond: {
              if: { $eq: ["$bestOfferData.discountType", "percentage"] },
              then: {
                $round: [
                  {
                    $subtract: [
                      "$price",
                      { $multiply: ["$price", { $divide: ["$bestOfferData.discountValue", 100] }] }
                    ]
                  },
                  2
                ]
              },
              else: {
                $round: [
                  { $max: [0, { $subtract: ["$price", "$bestOfferData.discountValue"] }] },
                  2
                ]
              }
            }
          },
          else: "$price"
        }
      },
      
      // Create structured offer object
      offer: {
        $cond: {
          if: { $ne: ["$bestOfferData", null] },
          then: {
            name: "$bestOfferData.name",
            type: "$bestOfferData.type",
            discountPercentage: {
              $cond: {
                if: { $eq: ["$bestOfferData.discountType", "percentage"] },
                then: "$bestOfferData.discountValue",
                else: {
                  $cond: {
                    if: { $gt: ["$price", 0] },
                    then: {
                      $round: [
                        { $multiply: [{ $divide: ["$bestOfferData.discountValue", "$price"] }, 100] },
                        2
                      ]
                    },
                    else: 0
                  }
                }
              }
            },
            discountAmount: {
              $cond: {
                if: { $eq: ["$bestOfferData.discountType", "percentage"] },
                then: {
                  $round: [
                    { $multiply: ["$price", { $divide: ["$bestOfferData.discountValue", 100] }] },
                    2
                  ]
                },
                else: "$bestOfferData.discountValue"
              }
            },
            offerPrice: {
              $cond: {
                if: { $eq: ["$bestOfferData.discountType", "percentage"] },
                then: {
                  $round: [
                    {
                      $subtract: [
                        "$price",
                        { $multiply: ["$price", { $divide: ["$bestOfferData.discountValue", 100] }] }
                      ]
                    },
                    2
                  ]
                },
                else: {
                  $round: [
                    { $max: [0, { $subtract: ["$price", "$bestOfferData.discountValue"] }] },
                    2
                  ]
                }
              }
            }
          },
          else: null
        }
      },
      
      // Additional metadata
      totalLessons: { $size: "$lessons" },
      isPopular: { $gte: ["$enrolledCount", 100] },
      isFree: { $eq: ["$price", 0] },
      hasDiscount: { $ne: ["$bestOfferData", null] }
    }
  });

  // 5. Lookup category
  pipeline.push({
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "_id",
      as: "category",
      pipeline: [{ $project: { _id: 1, name: 1 } }]
    }
  });

  // 6. Lookup instructor
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "instructor",
      foreignField: "_id",
      as: "instructor",
      pipeline: [{ $project: { _id: 1, fullName: 1, email: 1, profilePicture: 1 } }]
    }
  });

  // 7. Lookup lessons with conditional selection
  pipeline.push({
    $lookup: {
      from: "lessons",
      localField: "lessons",
      foreignField: "_id",
      as: "lessons",
      pipeline: [
        {
          $project: hasUserAccess 
            ? { // Include all fields if user has access
                _id: 1,
                title: 1,
                description: 1,
                content: 1,
                videoUrl: 1,
                thumbnailImage: 1,
                duration: 1,
                order: 1,
                resources: 1,
                createdAt: 1,
                updatedAt: 1
              }
            : { // Limited fields if no access
                _id: 1,
                title: 1, 
                description: 1, 
                thumbnailImage: 1 
              }
        }
      ]
    }
  });

  // 8. Unwind arrays
  pipeline.push(
    { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } }
  );

  // 9. Project final fields (inclusion only)
  pipeline.push({
    $project: {
      _id: 1,
      title: 1,
      description: 1,
      category: 1,
      instructor: 1,
      lessons: 1,
      price: 1, // Original price
      effectivePrice: 1, // Final price after discount
      offer: 1, // Structured offer object
      thumbnailImage: 1,
      features: 1,
      hashtags: 1,
      status: 1,
      enrolledCount: 1,
      rating: 1,
      totalLessons: 1,
      isPopular: 1,
      isFree: 1,
      hasDiscount: 1,
      createdAt: 1,
      updatedAt: 1
      // Note: keywords, applicableOffers, and bestOfferData are automatically excluded
    }
  });

  return pipeline;
}
// Main pipeline builder
export function buildCoursePipeline(filters, sortBy) {
  const pipeline = [];

  // 1. Match stage - filter courses
  pipeline.push({ $match: buildMatchConditions(filters) });

  // 2. Add text score for relevance sorting
  if (filters.query && sortBy === "relevance") {
    pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
  }

  // 3. Lookup offers - fetch all applicable offers
  pipeline.push({
    $lookup: {
      from: "offers",
      let: {
        courseId: "$_id",
        categoryIds: "$category",
        instructorId: "$instructor",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                // Only active offers within date range
                { $eq: ["$status", "active"] },
                { $lte: ["$startDate", new Date()] },
                { $gte: ["$endDate", new Date()] },
                {
                  $or: [
                    // Global offers
                    { $eq: ["$type", "global"] },
                    // First-time user offers
                    { $eq: ["$type", "first-time"] },
                    // Course-specific offers
                    {
                      $and: [
                        { $eq: ["$type", "course"] },
                        {
                          $in: [
                            "$$courseId",
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$applicableTo",
                                    cond: {
                                      $eq: ["$$this.refModel", "Course"],
                                    },
                                  },
                                },
                                as: "item",
                                in: "$$item.refId",
                              },
                            },
                          ],
                        },
                      ],
                    },
                    // Category offers
                    {
                      $and: [
                        { $eq: ["$type", "category"] },
                        {
                          $gt: [
                            {
                              $size: {
                                $setIntersection: [
                                  "$$categoryIds",
                                  {
                                    $map: {
                                      input: {
                                        $filter: {
                                          input: "$applicableTo",
                                          cond: {
                                            $eq: [
                                              "$$this.refModel",
                                              "Category",
                                            ],
                                          },
                                        },
                                      },
                                      as: "item",
                                      in: "$$item.refId",
                                    },
                                  },
                                ],
                              },
                            },
                            0,
                          ],
                        },
                      ],
                    },
                    // Instructor offers
                    {
                      $and: [
                        { $eq: ["$type", "instructor"] },
                        {
                          $in: [
                            "$$instructorId",
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$applicableTo",
                                    cond: {
                                      $eq: ["$$this.refModel", "Instructor"],
                                    },
                                  },
                                },
                                as: "item",
                                in: "$$item.refId",
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $project: {
            name: 1,
            type: 1,
            discountType: 1,
            discountValue: 1,
          },
        },
      ],
      as: "applicableOffers",
    },
  });

  // 4. Find best offer (highest discount)
  pipeline.push({
    $addFields: {
      bestOfferData: {
        $reduce: {
          input: "$applicableOffers",
          initialValue: null,
          in: {
            $cond: {
              if: { $eq: ["$$value", null] },
              then: "$$this",
              else: {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $cond: {
                          if: { $eq: ["$$this.discountType", "percentage"] },
                          then: "$$this.discountValue",
                          else: {
                            $cond: {
                              if: { $gt: ["$price", 0] },
                              then: {
                                $multiply: [
                                  {
                                    $divide: ["$$this.discountValue", "$price"],
                                  },
                                  100,
                                ],
                              },
                              else: 0,
                            },
                          },
                        },
                      },
                      {
                        $cond: {
                          if: { $eq: ["$$value.discountType", "percentage"] },
                          then: "$$value.discountValue",
                          else: {
                            $cond: {
                              if: { $gt: ["$price", 0] },
                              then: {
                                $multiply: [
                                  {
                                    $divide: [
                                      "$$value.discountValue",
                                      "$price",
                                    ],
                                  },
                                  100,
                                ],
                              },
                              else: 0,
                            },
                          },
                        },
                      },
                    ],
                  },
                  then: "$$this",
                  else: "$$value",
                },
              },
            },
          },
        },
      },
    },
  });

  // 5. Calculate pricing and offer details
  pipeline.push({
    $addFields: {
      // Calculate effective price (final price after discount)
      effectivePrice: {
        $cond: {
          if: { $ne: ["$bestOfferData", null] },
          then: {
            $cond: {
              if: { $eq: ["$bestOfferData.discountType", "percentage"] },
              then: {
                $round: [
                  {
                    $subtract: [
                      "$price",
                      {
                        $multiply: [
                          "$price",
                          { $divide: ["$bestOfferData.discountValue", 100] },
                        ],
                      },
                    ],
                  },
                  2,
                ],
              },
              else: {
                $round: [
                  {
                    $max: [
                      0,
                      { $subtract: ["$price", "$bestOfferData.discountValue"] },
                    ],
                  },
                  2,
                ],
              },
            },
          },
          else: "$price",
        },
      },

      // Create structured offer object
      offer: {
        $cond: {
          if: { $ne: ["$bestOfferData", null] },
          then: {
            name: "$bestOfferData.name",
            type: "$bestOfferData.type",
            discountPercentage: {
              $cond: {
                if: { $eq: ["$bestOfferData.discountType", "percentage"] },
                then: "$bestOfferData.discountValue",
                else: {
                  $cond: {
                    if: { $gt: ["$price", 0] },
                    then: {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                "$bestOfferData.discountValue",
                                "$price",
                              ],
                            },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
            discountAmount: {
              $cond: {
                if: { $eq: ["$bestOfferData.discountType", "percentage"] },
                then: {
                  $round: [
                    {
                      $multiply: [
                        "$price",
                        { $divide: ["$bestOfferData.discountValue", 100] },
                      ],
                    },
                    2,
                  ],
                },
                else: "$bestOfferData.discountValue",
              },
            },
            offerPrice: {
              $cond: {
                if: { $eq: ["$bestOfferData.discountType", "percentage"] },
                then: {
                  $round: [
                    {
                      $subtract: [
                        "$price",
                        {
                          $multiply: [
                            "$price",
                            { $divide: ["$bestOfferData.discountValue", 100] },
                          ],
                        },
                      ],
                    },
                    2,
                  ],
                },
                else: {
                  $round: [
                    {
                      $max: [
                        0,
                        {
                          $subtract: ["$price", "$bestOfferData.discountValue"],
                        },
                      ],
                    },
                    2,
                  ],
                },
              },
            },
          },
          else: null,
        },
      },

      // Additional metadata
      totalLessons: { $size: "$lessons" },
      isPopular: { $gte: ["$enrolledCount", 100] },
      isFree: { $eq: ["$price", 0] },
      hasDiscount: { $ne: ["$bestOfferData", null] },
    },
  });

  // 6. Lookup related data
  pipeline.push(
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
        pipeline: [{ $project: { _id: 1, name: 1 } }],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "instructor",
        foreignField: "_id",
        as: "instructor",
        pipeline: [
          { $project: { _id: 1, fullName: 1, profilePicture: 1, bio: 1 } },
        ],
      },
    },
    { $unwind: { path: "$instructor", preserveNullAndEmptyArrays: true } }
  );

  // 7. Project final fields
  pipeline.push({
    $project: {
      _id: 1,
      title: 1,
      category: 1,
      description: 1,
      price: 1, // Original price
      effectivePrice: 1, // Final price after discount
      offer: 1, // Structured offer object
      features: 1,
      instructor: 1,
      status: 1,
      enrolledCount: 1,
      rating: 1,
      thumbnailImage: 1,
      hashtags: 1,
      totalLessons: 1,
      isPopular: 1,
      isFree: 1,
      hasDiscount: 1,
      createdAt: 1,
      updatedAt: 1,
      ...(filters.query && sortBy === "relevance" && { score: 1 }),
    },
  });

  // 8. Sort
  pipeline.push({ $sort: getSort(sortBy) });

  // 9. Pagination
  const skip = (filters.page - 1) * filters.limit;
  pipeline.push({ $skip: skip }, { $limit: filters.limit });

  return pipeline;
}

// Build match conditions
function buildMatchConditions(filters) {
  const matchConditions = {};

  // Status filter
  if (filters.status !== "all") {
    matchConditions.status = filters.status;
  }

  // Text search
  if (filters.query) {
    matchConditions.$text = { $search: filters.query };
  }

  // Category filter
  if (filters.category) {
    const validCategoryIds = filters.category.filter(isValidObjectId);
    if (validCategoryIds.length > 0) {
      matchConditions.category = {
        $in: validCategoryIds.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
  }

  // Instructor filter
  if (filters.instructor) {
    matchConditions.instructor = new mongoose.Types.ObjectId(
      filters.instructor
    );
  }

  // Price filters
  if (
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.priceType
  ) {
    const priceConditions = {};

    if (filters.priceType === "free") {
      priceConditions.price = 0;
    } else if (filters.priceType === "paid") {
      priceConditions.price = { $gt: 0 };
    } else {
      if (filters.minPrice !== null) {
        priceConditions.price = {
          ...priceConditions.price,
          $gte: filters.minPrice,
        };
      }
      if (filters.maxPrice !== null) {
        priceConditions.price = {
          ...priceConditions.price,
          $lte: filters.maxPrice,
        };
      }
    }

    Object.assign(matchConditions, priceConditions);
  }

  // Rating filter
  if (filters.minRating !== null || filters.maxRating !== null) {
    const ratingConditions = {};
    if (filters.minRating !== null) {
      ratingConditions["rating.averageRating"] = { $gte: filters.minRating };
    }
    if (filters.maxRating !== null) {
      ratingConditions["rating.averageRating"] = {
        ...ratingConditions["rating.averageRating"],
        $lte: filters.maxRating,
      };
    }
    Object.assign(matchConditions, ratingConditions);
  }

  // Features filter
  if (filters.features) {
    matchConditions.features = { $in: filters.features };
  }

  // Hashtags filter
  if (filters.hashtags) {
    matchConditions.hashtags = { $in: filters.hashtags };
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    const dateConditions = {};
    if (filters.dateFrom) dateConditions.$gte = filters.dateFrom;
    if (filters.dateTo) dateConditions.$lte = filters.dateTo;
    matchConditions.createdAt = dateConditions;
  }

  return matchConditions;
}

// Get total count
export async function getTotalCount(pipeline) {
  const countPipeline = [...pipeline.slice(0, -2), { $count: "total" }];
  const result = await Course.aggregate(countPipeline);
  return result.length > 0 ? result[0].total : 0;
}

// Calculate pagination metadata
export function calculatePagination(totalCount, page, limit) {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}


// Helper function to validate and sanitize filters
export function validateAndSanitizeFilters(params) {
  const {
    status,
    page,
    limit,
    query,
    category,
    instructor,
    minPrice,
    maxPrice,
    minRating,
    maxRating,
    features,
    hashtags,
    priceType,
    dateFrom,
    dateTo,
    hasOffer,
  } = params;

  // Validate status
  if (!["draft", "published", "archived", "all"].includes(status)) {
    throw new AppError("Invalid status filter", 400);
  }

  return {
    status,
    page: Math.max(1, parseInt(page)),
    limit: Math.min(50, Math.max(1, parseInt(limit))),
    query: query.trim(),
    category: category
      ? Array.isArray(category)
        ? category
        : [category]
      : null,
    instructor: instructor && isValidObjectId(instructor) ? instructor : null,
    minPrice: minPrice !== undefined ? parseFloat(minPrice) : null,
    maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : null,
    minRating: minRating !== undefined ? parseFloat(minRating) : null,
    maxRating: maxRating !== undefined ? parseFloat(maxRating) : null,
    features: features
      ? Array.isArray(features)
        ? features
        : [features]
      : null,
    hashtags: hashtags
      ? Array.isArray(hashtags)
        ? hashtags
        : [hashtags]
      : null,
    priceType,
    dateFrom: dateFrom ? new Date(dateFrom) : null,
    dateTo: dateTo ? new Date(dateTo) : null,
    hasOffer,
  };
}


// Build aggregation pipeline for cart with offers
export function buildCartPipeline(userId) {
  const pipeline = [];

  // 1. Match user's cart
  pipeline.push({
    $match: { userId: new mongoose.Types.ObjectId(userId) }
  });

  // 2. Lookup cart items (courses)
  pipeline.push({
    $lookup: {
      from: "courses",
      localField: "items",
      foreignField: "_id",
      as: "items"
    }
  });

  // 3. Unwind items to process each course individually
  pipeline.push({
    $unwind: { path: "$items", preserveNullAndEmptyArrays: true }
  });

  // 4. Lookup offers for each course
  pipeline.push({
    $lookup: {
      from: "offers",
      let: { 
        courseId: "$items._id", 
        categoryIds: "$items.category", 
        instructorId: "$items.instructor" 
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                // Only active offers within date range
                { $eq: ["$status", "active"] },
                { $lte: ["$startDate", new Date()] },
                { $gte: ["$endDate", new Date()] },
                {
                  $or: [
                    // Global offers
                    { $eq: ["$type", "global"] },
                    // First-time user offers
                    { $eq: ["$type", "first-time"] },
                    // Course-specific offers
                    {
                      $and: [
                        { $eq: ["$type", "course"] },
                        {
                          $in: [
                            "$$courseId",
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$applicableTo",
                                    cond: { $eq: ["$$this.refModel", "Course"] }
                                  }
                                },
                                as: "item",
                                in: "$$item.refId"
                              }
                            }
                          ]
                        }
                      ]
                    },
                    // Category offers
                    {
                      $and: [
                        { $eq: ["$type", "category"] },
                        {
                          $gt: [
                            {
                              $size: {
                                $setIntersection: [
                                  "$$categoryIds",
                                  {
                                    $map: {
                                      input: {
                                        $filter: {
                                          input: "$applicableTo",
                                          cond: { $eq: ["$$this.refModel", "Category"] }
                                        }
                                      },
                                      as: "item",
                                      in: "$$item.refId"
                                    }
                                  }
                                ]
                              }
                            },
                            0
                          ]
                        }
                      ]
                    },
                    // Instructor offers
                    {
                      $and: [
                        { $eq: ["$type", "instructor"] },
                        {
                          $in: [
                            "$$instructorId",
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$applicableTo",
                                    cond: { $eq: ["$$this.refModel", "Instructor"] }
                                  }
                                },
                                as: "item",
                                in: "$$item.refId"
                              }
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            name: 1,
            type: 1,
            discountType: 1,
            discountValue: 1
          }
        }
      ],
      as: "applicableOffers"
    }
  });

  // 5. Find best offer for each course
  pipeline.push({
    $addFields: {
      "items.bestOfferData": {
        $reduce: {
          input: "$applicableOffers",
          initialValue: null,
          in: {
            $cond: {
              if: { $eq: ["$$value", null] },
              then: "$$this",
              else: {
                $cond: {
                  if: {
                    $gt: [
                      {
                        $cond: {
                          if: { $eq: ["$$this.discountType", "percentage"] },
                          then: "$$this.discountValue",
                          else: {
                            $cond: {
                              if: { $gt: ["$items.price", 0] },
                              then: { $multiply: [{ $divide: ["$$this.discountValue", "$items.price"] }, 100] },
                              else: 0
                            }
                          }
                        }
                      },
                      {
                        $cond: {
                          if: { $eq: ["$$value.discountType", "percentage"] },
                          then: "$$value.discountValue",
                          else: {
                            $cond: {
                              if: { $gt: ["$items.price", 0] },
                              then: { $multiply: [{ $divide: ["$$value.discountValue", "$items.price"] }, 100] },
                              else: 0
                            }
                          }
                        }
                      }
                    ]
                  },
                  then: "$$this",
                  else: "$$value"
                }
              }
            }
          }
        }
      }
    }
  });

  // 6. Calculate pricing and offer details for each course
  pipeline.push({
    $addFields: {
      "items.effectivePrice": {
        $cond: {
          if: { $ne: ["$items.bestOfferData", null] },
          then: {
            $cond: {
              if: { $eq: ["$items.bestOfferData.discountType", "percentage"] },
              then: {
                $round: [
                  {
                    $subtract: [
                      "$items.price",
                      { $multiply: ["$items.price", { $divide: ["$items.bestOfferData.discountValue", 100] }] }
                    ]
                  },
                  2
                ]
              },
              else: {
                $round: [
                  { $max: [0, { $subtract: ["$items.price", "$items.bestOfferData.discountValue"] }] },
                  2
                ]
              }
            }
          },
          else: "$items.price"
        }
      },
      
      "items.offer": {
        $cond: {
          if: { $ne: ["$items.bestOfferData", null] },
          then: {
            name: "$items.bestOfferData.name",
            type: "$items.bestOfferData.type",
            discountPercentage: {
              $cond: {
                if: { $eq: ["$items.bestOfferData.discountType", "percentage"] },
                then: "$items.bestOfferData.discountValue",
                else: {
                  $cond: {
                    if: { $gt: ["$items.price", 0] },
                    then: {
                      $round: [
                        { $multiply: [{ $divide: ["$items.bestOfferData.discountValue", "$items.price"] }, 100] },
                        2
                      ]
                    },
                    else: 0
                  }
                }
              }
            },
            discountAmount: {
              $cond: {
                if: { $eq: ["$items.bestOfferData.discountType", "percentage"] },
                then: {
                  $round: [
                    { $multiply: ["$items.price", { $divide: ["$items.bestOfferData.discountValue", 100] }] },
                    2
                  ]
                },
                else: "$items.bestOfferData.discountValue"
              }
            },
            offerPrice: {
              $cond: {
                if: { $eq: ["$items.bestOfferData.discountType", "percentage"] },
                then: {
                  $round: [
                    {
                      $subtract: [
                        "$items.price",
                        { $multiply: ["$items.price", { $divide: ["$items.bestOfferData.discountValue", 100] }] }
                      ]
                    },
                    2
                  ]
                },
                else: {
                  $round: [
                    { $max: [0, { $subtract: ["$items.price", "$items.bestOfferData.discountValue"] }] },
                    2
                  ]
                }
              }
            }
          },
          else: null
        }
      },
      
      "items.hasDiscount": { $ne: ["$items.bestOfferData", null] }
    }
  });

  // 7. Lookup instructor for each course
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "items.instructor",
      foreignField: "_id",
      as: "items.instructor",
      pipeline: [{ $project: { _id: 1, fullName: 1, profilePicture: 1 } }]
    }
  });

  // 8. Unwind instructor
  pipeline.push({
    $unwind: { path: "$items.instructor", preserveNullAndEmptyArrays: true }
  });

  // 9. Group back to reconstruct cart
  pipeline.push({
    $group: {
      _id: "$_id",
      userId: { $first: "$userId" },
      items: {
        $push: {
          _id: "$items._id",
          title: "$items.title",
          description: "$items.description",
          price: "$items.price",
          effectivePrice: "$items.effectivePrice",
          offer: "$items.offer",
          hasDiscount: "$items.hasDiscount",
          thumbnailImage: "$items.thumbnailImage",
          instructor: "$items.instructor",
          rating: "$items.rating",
          enrolledCount: "$items.enrolledCount",
          createdAt: "$items.createdAt"
        }
      },
      createdAt: { $first: "$createdAt" },
      updatedAt: { $first: "$updatedAt" }
    }
  });

  return pipeline;
}

// Calculate cart summary
export function calculateCartSummary(items) {
  const totalOriginalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const totalEffectivePrice = items.reduce((sum, item) => sum + item.effectivePrice, 0);
  const totalSavings = totalOriginalPrice - totalEffectivePrice;
  const totalDiscountPercentage = totalOriginalPrice > 0 
    ? Math.round((totalSavings / totalOriginalPrice) * 100) 
    : 0;

  return {
    itemCount: items.length,
    totalOriginalPrice: Math.round(totalOriginalPrice * 100) / 100,
    totalEffectivePrice: Math.round(totalEffectivePrice * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    totalDiscountPercentage,
    hasAnyDiscount: items.some(item => item.hasDiscount)
  };
}


// Fixed helper function to get effective amounts
export const getProductsAndEffectiveAmount = async (isCart, courseIds, userId) => {
  let courseIdsToFetch = []

  if (isCart) {
    // Get user's cart course IDs
    const user = await User.findById(userId).select("cart")
    if (!user || !user.cart || user.cart.length === 0) {
      throw new Error("Cart is empty")
    }
    courseIdsToFetch = user.cart
  } else {
    // Use provided course IDs
    courseIdsToFetch = Array.isArray(courseIds) ? courseIds : [courseIds]
  }

  // Fetch courses with their current offers
  const courses = await Course.find({
    _id: { $in: courseIdsToFetch },
    status: "published", // Only published courses
  })

  if (courses.length === 0) {
    throw new Error("No valid courses found")
  }

  const productIds = courses.map((course) => course._id)

  // Calculate amounts
  let originalAmount = 0
  let effectiveAmount = 0

  courses.forEach((course) => {
    const price = course.price || 0
    originalAmount += price

    // Use effectivePrice if available, otherwise calculate from offer
    if (course.effectivePrice && course.effectivePrice !== price) {
      effectiveAmount += course.effectivePrice
    } else if (course.hasDiscount && course.offer) {
      // Calculate effective price from offer data
      let discountAmount = 0

      if (course.offer.discountPercentage) {
        discountAmount = (price * course.offer.discountPercentage) / 100
      } else if (course.offer.discountAmount) {
        discountAmount = course.offer.discountAmount
      }

      const effectivePrice = Math.max(price - discountAmount, 0)
      effectiveAmount += effectivePrice
    } else {
      effectiveAmount += price
    }
  })

  const offerSavings = originalAmount - effectiveAmount

  return {
    productIds,
    originalAmount,
    effectiveAmount,
    offerSavings,
  }
}