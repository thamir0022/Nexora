// utils/handleZodError.js
export const handleZodError = (error) => {
  return error.errors.reduce((acc, curr) => {
    acc[curr.path[0]] = curr.message;
    return acc;
  }, {});
};
