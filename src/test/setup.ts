import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Her testten sonra React ağacının DOM'dan temizlenmesini sağlar.
afterEach(() => {
  cleanup();
});
