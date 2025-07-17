// export {asyncHandler}

// const asyncHandler = (fn) => async (req, res, next) => {
//     try{
//         await fn(req, res, next);
//     }catch(error) {
//         res.status(err.code|| 500).json({
//             success: false,
//             message: error.message || "Internal Server Error",
//         })
//     }
// }

const asyncHandler = (requestHAndeler) => {
  (req, res, next) => {
    Promise.resolve(requestHAndeler(req, res, net)).catch((err) => next(err));
  };
};
export default asyncHandler;
// for Promise above was for try catch
