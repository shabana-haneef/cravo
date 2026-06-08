export const successResponse = (
  res,
  message,
  data = {},
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res,
  message,
  statusCode = 500
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export const paginatedResponse = (
  res,
  message,
  data,
  pagination
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};