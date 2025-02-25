const path = require("path");

module.exports = {
    mode: "production", // ✅ Fixes the warning
    entry: "./src/index.js",
    output: {
        filename: "chatbot-widget.js",
        path: path.resolve(__dirname, "dist"),
        library: "ChatbotWidget",
        libraryTarget: "umd",
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,  // ✅ Add support for JSX files
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    resolve: {
        extensions: [".js", ".jsx"], // ✅ Allow Webpack to resolve .jsx files
    },
};
