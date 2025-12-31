import React, { useState } from "react";
import DamshiqueHome from "./DamshiqueHome";
import LoginPage from "./LoginPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return <DamshiqueHome />;
}
