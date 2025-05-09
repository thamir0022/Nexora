export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "RouteNotFound",
    message: `The requested route [${req.method} ${req.originalUrl}] does not exist on the server.`,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
}