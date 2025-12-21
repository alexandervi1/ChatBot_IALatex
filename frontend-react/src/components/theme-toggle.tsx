"use client"

import * as React from "react"
import { Moon, Sun, Flame, Eye, Code, Clock } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Oscuro
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setTheme("red")}>
          <Flame className="mr-2 h-4 w-4 text-red-500" />
          Rojo Pasión
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("high-contrast")}>
          <Eye className="mr-2 h-4 w-4" />
          Alto Contraste
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("matrix")}>
          <Code className="mr-2 h-4 w-4 text-green-500" />
          Matrix
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("vintage")}>
          <Clock className="mr-2 h-4 w-4 text-amber-600" />
          Vintage
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setTheme("system")}>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
