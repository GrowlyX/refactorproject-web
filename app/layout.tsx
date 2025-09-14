// Import the base CSS styles for the radix-ui components.
import "@radix-ui/themes/styles.css";

import type { Metadata } from "next";
import { Theme } from "@radix-ui/themes";
import {
    AuthKitProvider,
    Impersonation,
} from "@workos-inc/authkit-nextjs/components";
import "./globals.css";

export const metadata: Metadata = {
    title: "Refactor Project",
    description: "Example Next.js application demonstrating how to use AuthKit.",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body style={{ padding: 0, margin: 0 }}>
        <Theme
            accentColor="iris"
            panelBackground="solid"
            style={{ backgroundColor: "var(--gray-1)" }}
        >
            <AuthKitProvider>
                <Impersonation />
                <html lang="en">
                <body>
                {children}
                </body>
                </html>
            </AuthKitProvider>
        </Theme>
        </body>
        </html>
    );
}
