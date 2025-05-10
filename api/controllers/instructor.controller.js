import InstructorQualification from '../models/instructorQualification.model.js';

export const addInstructorQualification = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;

    // Role check
    if (role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can submit qualifications.' });
    }

    const {
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    } = req.body;

    // Basic input validation
    if (
      !Array.isArray(qualifications) ||
      qualifications.length === 0 ||
      !experienceSummary ||
      !Array.isArray(socialLinks)
    ) {
      return res.status(400).json({ message: 'Missing or invalid fields in request body.' });
    }

    // Check if instructor already submitted qualifications
    const existing = await InstructorQualification.findOne({ userId });
    if (existing) {
      return res.status(409).json({ message: 'Qualification already submitted.' });
    }

    const newQualification = new InstructorQualification({
      userId,
      qualifications,
      experienceSummary,
      portfolioLink,
      socialLinks,
    });

    await newQualification.save();

    res.status(201).json({ message: 'Qualification submitted successfully.', data: newQualification });
  } catch (error) {
    console.error('Error adding instructor qualification:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
