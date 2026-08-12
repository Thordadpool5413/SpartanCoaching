import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Users, Flame, Crosshair, LayoutDashboard } from "lucide-react";
import { navSections, additionalPages } from "@/lib/navigation";
import { FIELD_KIT_TOOLS } from "@/lib/fieldKitCatalog";

const commandItems = [
  {
    category: "Workspace",
    items: [
      { title: "Portal home", path: "/portal", icon: LayoutDashboard },
      { title: "Command Center", path: "/tools/sales-workflow", icon: Crosshair },
      { title: "Account settings", path: "/account", icon: LayoutDashboard },
      {
        title: "Start a Role-Play",
        path: "/tools/role-play",
        icon: Users,
      },
      { title: "Today's Drill", path: "/drills", icon: Flame },
      ...FIELD_KIT_TOOLS.slice(0, 12).map((t) => ({
        title: t.title,
        path: t.path,
        icon: Crosshair,
      })),
    ],
  },
  ...navSections.map((section) => ({
    category: section.title,
    items: section.items.map((item) => ({
      title: item.label,
      path: item.path,
      icon: item.icon,
    })),
  })),
  {
    category: "More Pages",
    items: additionalPages.map((item) => ({
      title: item.label,
      path: item.path,
      icon: item.icon,
    })),
  },
];

export function CommandPalette() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} data-testid="command-palette">
      <CommandInput
        placeholder="Search pages, tools, and actions..."
        data-testid="command-input"
      />

      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commandItems.map((category, categoryIndex) => (
          <div key={category.category}>
            {categoryIndex > 0 && <CommandSeparator />}
            <CommandGroup heading={category.category}>
              {category.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <CommandItem
                    key={`${category.category}-${item.path}`}
                    value={item.title}
                    onSelect={() => handleSelect(item.path)}
                    data-testid={`command-item-${item.path}`}
                  >
                    <IconComponent className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
