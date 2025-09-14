"use client";
import Link from "next/link";
import { ArrowRight, Code, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">REFACTOR</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#docs" className="text-gray-600 hover:text-gray-900">Docs</a>
            <a href="#blog" className="text-gray-600 hover:text-gray-900">Blog</a>
          </nav>
          <Link 
            href="/dashboard"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 opacity-10"></div>
        <div className="relative px-6 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Systematically refactor your code using AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Built to make you extraordinarily productive, Refactor is the best way to systematically improve your codebase with AI-powered analysis and suggestions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors">
              View Demo
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="px-6 py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why choose Refactor?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
                <p className="text-gray-600">
                  Advanced AI algorithms analyze your codebase to identify refactoring opportunities and suggest improvements.
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Safe Refactoring</h3>
                <p className="text-gray-600">
                  Automated testing ensures your refactoring changes don't break existing functionality.
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Systematic Approach</h3>
                <p className="text-gray-600">
                  Follow proven methodologies to systematically improve code quality across your entire project.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to transform your codebase?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of developers who are already using Refactor to improve their code quality.
            </p>
            <Link 
              href="/dashboard"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 inline-flex items-center gap-2"
            >
              Start Refactoring Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">REFACTOR</span>
            </div>
            <div className="flex gap-8">
              <a href="#privacy" className="text-gray-400 hover:text-white">Privacy</a>
              <a href="#terms" className="text-gray-400 hover:text-white">Terms</a>
              <a href="#contact" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Refactor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
