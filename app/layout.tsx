// Import the base CSS styles for the radix-ui components.
import "@radix-ui/themes/styles.css";

import type { Metadata } from "next";
import NextLink from "next/link";
import { Theme, Card, Container, Flex, Button, Box } from "@radix-ui/themes";
import {
    AuthKitProvider,
    Impersonation,
} from "@workos-inc/authkit-nextjs/components";
import "./globals.css";
import {Geist, Geist_Mono} from "next/dist/compiled/@next/font/dist/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

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
                <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
                </body>
                </html>
            </AuthKitProvider>
        </Theme>
        </body>
        </html>
    );
}
