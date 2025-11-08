import js from "@eslint/js";
import globals from "globals";
import path from 'path';
import fs from 'fs';
import reactPlugin from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

const modelDir = path.resolve("api/models");
const modelGlobals = {};
if (fs.existsSync(modelDir)) {
    for (const file of fs.readdirSync(modelDir)) {
        const modelName = path.basename(file, path.extname(file));
        modelGlobals[modelName] = true;
    }
}

export default defineConfig([
    // Base
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },
            ecmaVersion: 2021,
            sourceType: "module",
        },
        rules: {
            ...js.configs.recommended.rules,
        },
    },

    // Backend
    {
        files: ["api/**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...modelGlobals,
                sails: true,
                _: true,
            },
        },
    },

    // Frontend
    {
        files: ["assets/js/**/*.{js,jsx}"],
        plugins: {
            react: reactPlugin,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
        },
        settings: {
            react: {
                version: "detect"
            }
        }
    },
]);
