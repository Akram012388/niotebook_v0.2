import { type ReactElement } from "react";
import { type Metadata } from "next";
import { LandingNav } from "@/ui/landing/LandingNav";
import { LandingFooter } from "@/ui/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Info — Niotebook",
  description:
    "Learn about Niotebook, our courses, documentation, legal policies, and how to connect with us.",
};

/* -----------------------------------------------------------------------
   Section navigation data
   ----------------------------------------------------------------------- */

interface NavSection {
  id: string;
  label: string;
}

const NAV_SECTIONS: { heading: string; items: NavSection[] }[] = [
  {
    heading: "Product",
    items: [
      { id: "about", label: "About" },
      { id: "courses", label: "Courses" },
      { id: "docs", label: "Docs" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { id: "blog", label: "Blog" },
      { id: "changelog", label: "Changelog" },
      { id: "status", label: "Status" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { id: "terms", label: "Terms" },
      { id: "privacy", label: "Privacy" },
      { id: "cookies", label: "Cookies" },
    ],
  },
  {
    heading: "Connect",
    items: [{ id: "connect", label: "Connect" }],
  },
];

/* -----------------------------------------------------------------------
   Page
   ----------------------------------------------------------------------- */

export default function InfoPage(): ReactElement {
  return (
    <div className="scroll-smooth">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{
          background: "var(--accent)",
          color: "var(--accent-foreground)",
        }}
      >
        Skip to content
      </a>

      <LandingNav />

      <main
        id="content"
        className="mx-auto max-w-3xl px-4 pt-[96px] pb-16 sm:px-6"
      >
        {/* ----- In-page navigation ----- */}
        <nav aria-label="Page sections" className="mb-12">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {NAV_SECTIONS.map((group) => (
              <div key={group.heading} className="flex items-center gap-1.5">
                <span className="text-xs font-mono uppercase tracking-widest text-text-subtle">
                  {group.heading}
                </span>
                <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
                  {group.items.map((item, i) => (
                    <span key={item.id}>
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className="mr-1.5 text-text-subtle"
                        >
                          &middot;
                        </span>
                      )}
                      <a
                        href={`#${item.id}`}
                        className="text-text-muted transition-colors hover:text-accent"
                      >
                        {item.label}
                      </a>
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </nav>

        {/* =================================================================
           PRODUCT
           ================================================================= */}

        {/* About */}
        <section id="about" className="scroll-mt-24 pb-12">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            About Niotebook
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-text-muted">
            <p>
              Niotebook is an interactive coding education platform built for
              learners who ship. It brings together video lessons, a live code
              editor, an AI tutor, and a virtual filesystem into one seamless
              workspace &mdash; so you never have to leave the learning
              environment to practice what you&rsquo;re being taught.
            </p>
            <p>
              The vision is straightforward: watching a lecture and writing code
              should happen in the same place, at the same time. Each lesson
              pairs a video with a fully functional IDE &mdash; multi-file
              editor, integrated terminal, file tree &mdash; and an AI assistant
              that understands both the curriculum and your code. You watch, you
              write, you ask questions, and you build.
            </p>
            <p>
              Niotebook is built by Akram as a passion project, born from the
              belief that the best way to learn programming is by doing it
              alongside guided instruction. It&rsquo;s currently in early access
              and evolving rapidly.
            </p>
          </div>
        </section>

        {/* Courses */}
        <section
          id="courses"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Courses
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-text-muted">
            <p>
              Every course on Niotebook is structured around video lectures
              paired with hands-on coding exercises. You don&rsquo;t just watch
              &mdash; you write code in a full IDE that lives right next to the
              lesson. The editor supports multiple files, a terminal for running
              your programs, and a file tree for navigating your project.
            </p>
            <p>
              Courses cover web development, systems programming, and more.
              Each lesson includes an AI assistant that can answer questions
              about the material, help debug your code, and suggest next steps.
              The assistant is context-aware: it knows which lecture you&rsquo;re
              watching, what code you&rsquo;ve written, and where you are in the
              curriculum.
            </p>
            <p>
              Whether you&rsquo;re picking up your first programming language or
              deepening expertise in a specific domain, courses on Niotebook are
              designed to get you building real things as quickly as possible.
            </p>
          </div>
        </section>

        {/* Docs */}
        <section
          id="docs"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Documentation
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-text-muted">
            <p>
              The Niotebook knowledge base covers everything from getting
              started with your first course to understanding the workspace
              layout, editor shortcuts, and AI assistant capabilities.
              Documentation is organized by topic and written to be practical
              &mdash; quick answers, not long reads.
            </p>
            <p>
              API references and advanced integration guides are coming soon as
              the platform matures. For now, if something isn&rsquo;t covered in
              the docs, reach out directly and we&rsquo;ll help.
            </p>
          </div>
        </section>

        {/* =================================================================
           RESOURCES
           ================================================================= */}

        {/* Blog */}
        <section
          id="blog"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Blog
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-text-muted">
            <p>
              The Niotebook blog will feature engineering deep-dives, learning
              insights, and product updates. Expect posts on how the platform is
              built, the design decisions behind the workspace, and practical
              advice for learners at every level.
            </p>
            <p>
              Regular posts are coming soon. In the meantime, follow along on{" "}
              <a
                href="https://x.com/CodeAkram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                X
              </a>{" "}
              for shorter updates and behind-the-scenes looks at what&rsquo;s
              being built.
            </p>
          </div>
        </section>

        {/* Changelog */}
        <section
          id="changelog"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Changelog
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-text-muted">
            <p>
              Niotebook is in active development. The changelog will document
              every meaningful update &mdash; new features, improvements, and
              fixes &mdash; so you can see exactly what&rsquo;s changed and when.
            </p>
            <p>
              The platform is currently in alpha. Early access users are helping
              shape the product, and feedback directly influences what ships
              next. A structured changelog with versioned entries is coming as
              the release cadence stabilizes.
            </p>
          </div>
        </section>

        {/* Status */}
        <section
          id="status"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Status
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-text-muted">
            <p>
              All Niotebook services are monitored for availability and
              performance. The platform runs on Vercel (frontend), Convex
              (backend and real-time data), and Clerk (authentication), with
              code execution handled by in-browser runtimes.
            </p>
            <p>
              During the alpha phase, occasional downtime may occur as
              infrastructure is tuned and new features are deployed. A dedicated
              status page with real-time incident tracking and uptime metrics
              will be published as the platform approaches general availability.
            </p>
          </div>
        </section>

        {/* =================================================================
           LEGAL
           ================================================================= */}

        {/* Terms of Service */}
        <section
          id="terms"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Terms of Service
          </h2>
          <p className="mb-6 text-sm text-text-subtle italic">
            Draft &mdash; Last updated February 2026
          </p>
          <div className="space-y-6 text-base leading-relaxed text-text-muted">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing or using Niotebook (&ldquo;the Service&rdquo;), you
                agree to be bound by these Terms of Service. If you do not agree
                to these terms, do not use the Service. We reserve the right to
                update these terms at any time, and continued use of the Service
                after changes constitutes acceptance of the revised terms.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                2. User Accounts
              </h3>
              <p>
                You must create an account to access Niotebook. You are
                responsible for maintaining the confidentiality of your account
                credentials and for all activity that occurs under your account.
                The Service is currently in an invite-only alpha phase; access
                may be revoked at our discretion during this period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                3. Acceptable Use
              </h3>
              <p>
                You agree to use the Service for lawful purposes only. You may
                not use Niotebook to distribute malware, conduct unauthorized
                security testing, or execute code intended to harm the platform,
                its users, or external systems. The in-browser code execution
                environment is provided for educational purposes within the
                scope of course material.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                4. Intellectual Property
              </h3>
              <p>
                All course content, platform design, and code comprising the
                Niotebook Service are the intellectual property of Niotebook and
                its creators. Code you write within the workspace is yours.
                Course materials may not be redistributed, recorded, or
                reproduced without explicit written permission.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                5. Limitation of Liability
              </h3>
              <p>
                The Service is provided &ldquo;as is&rdquo; without warranties
                of any kind, either express or implied. Niotebook shall not be
                liable for any indirect, incidental, special, or consequential
                damages arising from your use of the Service. During the alpha
                phase, data loss or service interruptions may occur.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                6. Changes to Terms
              </h3>
              <p>
                We may revise these terms at any time by posting the updated
                version on this page. Material changes will be communicated via
                email or in-app notification. Your continued use of the Service
                after revisions are posted constitutes your acceptance of the
                updated terms.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Policy */}
        <section
          id="privacy"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Privacy Policy
          </h2>
          <p className="mb-6 text-sm text-text-subtle italic">
            Draft &mdash; Last updated February 2026
          </p>
          <div className="space-y-6 text-base leading-relaxed text-text-muted">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Information We Collect
              </h3>
              <p>
                When you create an account, we collect your email address and
                basic profile information through our authentication provider,
                Clerk. When you use the workspace, we store your course
                progress, code files (in your browser&rsquo;s local storage via
                IndexedDB), and chat interactions with the AI assistant.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                How We Use Your Data
              </h3>
              <p>
                Your data is used to provide the Service: authenticating your
                session, tracking course progress, and powering the AI
                assistant&rsquo;s context-aware responses. We do not sell your
                personal data to third parties. Anonymized, aggregated usage
                data may be used to improve the platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Third-Party Services
              </h3>
              <p>
                Niotebook relies on the following third-party services to
                operate:{" "}
                <strong className="text-foreground font-medium">Clerk</strong>{" "}
                for authentication,{" "}
                <strong className="text-foreground font-medium">Convex</strong>{" "}
                for real-time data storage and backend functions,{" "}
                <strong className="text-foreground font-medium">Vercel</strong>{" "}
                for hosting and deployment, and{" "}
                <strong className="text-foreground font-medium">
                  Google / Groq
                </strong>{" "}
                for AI model inference. Each of these services has its own
                privacy policy governing how they handle data.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Data Retention
              </h3>
              <p>
                Account data is retained for as long as your account is active.
                Code files stored in your browser&rsquo;s IndexedDB are managed
                locally and not transmitted to our servers. Course progress and
                chat history stored in Convex are retained until you delete your
                account or request data removal.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Your Rights
              </h3>
              <p>
                You may request access to, correction of, or deletion of your
                personal data at any time by contacting{" "}
                <a
                  href="mailto:niotebook@gmail.com"
                  className="text-accent hover:underline"
                >
                  niotebook@gmail.com
                </a>
                . We will respond to requests within 30 days.
              </p>
            </div>
          </div>
        </section>

        {/* Cookie Policy */}
        <section
          id="cookies"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
            Cookie Policy
          </h2>
          <p className="mb-6 text-sm text-text-subtle italic">
            Draft &mdash; Last updated February 2026
          </p>
          <div className="space-y-6 text-base leading-relaxed text-text-muted">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                What Cookies We Use
              </h3>
              <p>
                Niotebook uses a minimal set of cookies to operate.
                Authentication cookies are managed by Clerk to maintain your
                signed-in session. A theme preference cookie stores your light
                or dark mode choice. No advertising or tracking cookies are
                used.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Purpose
              </h3>
              <p>
                All cookies used by Niotebook are strictly functional. They
                enable authentication (so you stay signed in between visits) and
                store user preferences (theme selection, sidebar state). These
                are essential for the Service to work correctly.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Managing Cookies
              </h3>
              <p>
                You can clear or block cookies through your browser settings.
                Note that disabling cookies will prevent you from signing in to
                Niotebook. For more information on managing cookies, consult
                your browser&rsquo;s documentation.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================
           CONNECT
           ================================================================= */}

        <section
          id="connect"
          className="scroll-mt-24 border-t border-border py-12"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">
            Connect
          </h2>
          <ul className="space-y-4 text-base leading-relaxed" role="list">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-text-muted" aria-hidden="true">
                <XIconInline />
              </span>
              <div>
                <a
                  href="https://x.com/CodeAkram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-accent transition-colors"
                >
                  Follow us on X
                </a>
                <p className="text-sm text-text-muted mt-0.5">
                  Product updates, engineering notes, and behind-the-scenes.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 opacity-50">
              <span className="mt-0.5 text-text-muted" aria-hidden="true">
                <GitHubIconInline />
              </span>
              <div>
                <span className="font-medium text-foreground cursor-default">
                  GitHub
                </span>
                <p className="text-sm text-text-muted mt-0.5">
                  Repository coming soon.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 opacity-50">
              <span className="mt-0.5 text-text-muted" aria-hidden="true">
                <DiscordIconInline />
              </span>
              <div>
                <span className="font-medium text-foreground cursor-default">
                  Discord
                </span>
                <p className="text-sm text-text-muted mt-0.5">Coming soon.</p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-text-muted" aria-hidden="true">
                <MailIconInline />
              </span>
              <div>
                <a
                  href="mailto:niotebook@gmail.com"
                  className="font-medium text-foreground hover:text-accent transition-colors"
                >
                  Email
                </a>
                <p className="text-sm text-text-muted mt-0.5">
                  Reach out at{" "}
                  <a
                    href="mailto:niotebook@gmail.com"
                    className="text-accent hover:underline"
                  >
                    niotebook@gmail.com
                  </a>{" "}
                  for questions, feedback, or collaboration.
                </p>
              </div>
            </li>
          </ul>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

/* -----------------------------------------------------------------------
   Inline SVG icons (compact, same as LandingFooter)
   ----------------------------------------------------------------------- */

function XIconInline(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubIconInline(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function DiscordIconInline(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  );
}

function MailIconInline(): ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
