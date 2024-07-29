'use client';

import { AppShell, ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { NavbarContent } from "./NavbarContent";
import { FooterContent } from "./FooterContent";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = createTheme({
    fontFamily: 'Open Sans, sans-serif',
    primaryColor: 'blue',
  });

  return (
    <>
      <ColorSchemeScript />
      <MantineProvider defaultColorScheme="dark" theme={theme}>
        <AppShell
          padding="md"
          navbar={{
            width: 80,
            breakpoint: 'sm',
          }}
          footer={{
            height: 60,
          }}
        >
          <AppShell.Navbar>
            <NavbarContent />
          </AppShell.Navbar>

          <AppShell.Main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {children}
          </AppShell.Main>

          <AppShell.Footer p="md">
            <FooterContent />
          </AppShell.Footer>
        </AppShell>
      </MantineProvider>
    </>
  );
}
