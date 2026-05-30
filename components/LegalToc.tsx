"use client";

import { useEffect, useState } from "react";

interface Section {
  id: string;
  text: string;
}

export function LegalToc() {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll("main h2"));
    const discovered: Section[] = headings.map((el, i) => {
      const id = el.id || `section-${i}`;
      el.id = id;
      return { id, text: el.textContent ?? "" };
    });
    setSections(discovered);
    if (discovered[0]) setActiveId(discovered[0].id);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -75% 0px" }
    );
    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (sections.length === 0) return null;

  return (
    <nav className="px-5 pt-8 pb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
        Contents
      </p>
      <ul className="space-y-0.5">
        {sections.map((s, i) => {
          const isActive = activeId === s.id;
          return (
            <li
              key={s.id}
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs transition-all duration-200 ease-out ${
                  isActive
                    ? "text-foreground font-medium bg-muted/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <span
                  className={`h-1 w-1 rounded-full shrink-0 transition-all duration-200 ${
                    isActive
                      ? "bg-primary scale-[1.4]"
                      : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                  }`}
                />
                <span className="leading-snug">{s.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
