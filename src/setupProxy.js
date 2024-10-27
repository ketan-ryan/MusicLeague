// const { createProxyMiddleware } = require('http-proxy-middleware');

// module.exports = function (app) {
//     app.use('/auth/**',
//         createProxyMiddleware({
//             target: 'http://localhost:5000'
//         })
//     );

//     app.use('/api/**',
//         createProxyMiddleware({
//             target: 'http://localhost:5000'
//         })
//     );

//     app.use('/telegram/**',
//         createProxyMiddleware({
//             target: 'http://localhost:5000'
//         })
//     );
// };

// const axios = require('axios');
// const { HttpsProxyAgent } = require('hpagent');
// const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Fallback for safety

// // Define Axios instance for different endpoints
// const axiosAuthInstance = axios.create({
//   baseURL: `${baseURL}/auth`, // Replace with your backend API for /auth
// });

// const axiosApiInstance = axios.create({
//   baseURL: `${baseURL}/api`, // Replace with your backend API for /api
// });

// const axiosTelegramInstance = axios.create({
//   baseURL: `${baseURL}/telegram`, // Replace with your backend API for /telegram
// });

// module.exports = {
//   fetchAuthData,
//   fetchApiData,
//   fetchTelegramData
// };
