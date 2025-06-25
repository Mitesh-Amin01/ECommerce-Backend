const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(next); // ✅ pass error to errorMiddleware
    };
};

export { asyncHandler }