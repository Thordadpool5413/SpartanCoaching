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
import {
  Home,
  Info,
  Briefcase,
  GraduationCap,
  Shield,
  MessageSquare,
  FileText,
  Headphones,
  FolderOpen,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Search,
  Mic,
  Mail,
  Users,
  Flame,
} from "lucide-react";

const commandItems = [
  {
    category: "Pages",
    items: [
      { title: "Home", path: "/", icon: Home },
      { title: "About", path: "/about", icon: Info },
      { title: "Services", path: "/services", icon: Briefcase },
      { title: "Programs", path: "/programs", icon: GraduationCap },
      { title: "Method", path: "/method", icon: Shield },
      { title: "Testimonials", path: "/testimonials", icon: MessageSquare },
      { title: "Articles", path: "/articles", icon: FileText },
      { title: "Podcasts", path: "/podcasts", icon: Headphones },
      { title: "Resources", path: "/resources", icon: FolderOpen },
      { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    category: "AI Tools",
    items: [
      {
        title: "Playbook Generator",
        path: "/tools/playbooks",
        icon: Lightbulb,
      },
      {
        title: "Objection Handler",
        path: "/tools/objections",
        icon: MessageCircle,
      },
      { title: "Grounded Research", path: "/tools/research", icon: Search },
      { title: "Audio Transcriber", path: "/tools/transcribe", icon: Mic },
      {
        title: "Email Templates",
        path: "/tools/email-templates",
        icon: Mail,
      },
      { title: "Role-Play Practice", path: "/tools/role-play", icon: Users },
    ],
  },
  {
    category: "Practice",
    items: [{ title: "Daily Drills", path: "/drills", icon: Flame }],
  },
  {
    category: "Quick Actions",
    items: [
      {
        title: "Start a Role-Play",
        path: "/tools/role-play",
        icon: Users,
      },
      { title: "Today's Drill", path: "/drills", icon: Flame },
    ],
  },
];

interface CommandItem {
  title: string;
  path: string;
  icon: any;
}

interface CommandCategory {
  category: string;
  items: CommandItem[];
}

export function CommandPalette() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
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
