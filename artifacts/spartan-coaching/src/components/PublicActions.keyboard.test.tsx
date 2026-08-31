import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppearanceControls } from "./AppearanceControls";
import { NavDropdown } from "./Layout";

afterEach(cleanup);

describe("public keyboard actions", () => {
  it("moves through a desktop menu with arrows and restores the trigger after Escape", async () => {
    render(
      <NavDropdown
        label="Consulting"
        dataTestId="dropdown-consulting-test"
        items={[
          { path: "/services", label: "Services", description: "Coaching services" },
          { path: "/contact", label: "Contact", description: "Book a call" },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Consulting menu" });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const services = await screen.findByRole("menuitem", { name: /services/i });
    await waitFor(() => expect(document.activeElement).toBe(services));

    fireEvent.keyDown(services, { key: "ArrowDown" });
    const contact = screen.getByRole("menuitem", { name: /contact/i });
    expect(document.activeElement).toBe(contact);

    fireEvent.keyDown(contact, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the theme picker as a labeled dialog and returns focus on Escape", async () => {
    render(
      <ThemeProvider>
        <AppearanceControls />
      </ThemeProvider>,
    );

    const trigger = screen.getByRole("button", { name: /change theme colors/i });
    fireEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Theme colors" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close" })));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("keeps the selected mode visible and keyboard-operable on a narrow viewport", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(
      <ThemeProvider>
        <AppearanceControls />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /change theme colors/i }));
    const light = await screen.findByRole("button", { name: /light/i });
    fireEvent.click(light);

    expect(light.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/active theme/i).parentElement?.getAttribute("aria-live")).toBe("polite");
  });
});