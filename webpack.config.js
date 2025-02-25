const path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/index.js",
    output: {
        filename: "chatbot-widget.js",
        path: path.resolve(__dirname, "dist"),
        library: "ChatbotWidget",
        libraryTarget: "umd",
        globalObject: "this",
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
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
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                type: "asset/resource",  // ✅ Fixes PNG image error
            },
        ],
    },
    resolve: {
        extensions: [".js", ".jsx"],
    },
};
