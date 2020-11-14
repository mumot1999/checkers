import { Renderer } from "@nodegui/react-nodegui";
import React from "react";
import App from "./app";
import {AppProvider} from "./tcp";

process.title = "My NodeGui App";
Renderer.render(<AppProvider>
  <App />
</AppProvider>, {
  onInit: reconciler => {
    if (process.env.NODE_ENV === "development") {
      require("@nodegui/devtools").connectReactDevtools(reconciler);
    }
  }
});
// This is for hot reloading (this will be stripped off in production by webpack)
if (module.hot) {
  module.hot.accept(["./app"], function() {
    Renderer.forceUpdate();
  });
}
