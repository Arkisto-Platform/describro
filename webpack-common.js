"use strict";

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const {VueLoaderPlugin} = require("vue-loader");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require('webpack');

require('dotenv').config({path: '../.env'});

module.exports = {
  target: "web",
  entry: ["./src/main.js"],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[contenthash].js",
    publicPath: process.env.ASSET_PATH || "http://localhost:9000/",
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {}
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: process.env.TITLE || "DescribRO",
      template: "./index.html",
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({filename: "[contenthash].css"})
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: "",
            },
          },
          "css-loader",
          "postcss-loader",
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: "",
            },
          },
          "css-loader",
          "postcss-loader",
        ],
      },
      {
        test: /\.(svg|png|jp(e*)g|gif|mp4)?$/,
        type: "asset/resource",
        // loader: "file-loader",
        // options: {
        //     name: "[contenthash].[ext]",
        //     esModule: false,
        // },
      },
      // {
      //     test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      //     loader: "url-loader",
      //     options: { limit: 10000, mimetype: " application/font-woff" },
      // },
      // { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        type: "asset/resource",
        // use: [
        //     {
        //         loader: "file-loader",
        //         options: {
        //             name: "[name].[ext]",
        //         },
        //     },
        // ],
      },
      {
        test: /\.mjs$/i,
        resolve: { byDependency: { esm: { fullySpecified: false } } }
      }
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      src: path.resolve(__dirname, "src"),
      assets: path.resolve(__dirname, "src/assets"),
      components: path.resolve(__dirname, "src/components"),
    }
  }
};
