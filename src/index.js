import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // index.css loaded last to override App.css defaults

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
