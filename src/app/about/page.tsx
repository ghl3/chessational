"use client";

// ============================================================================
// Section Component
// ============================================================================

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-gray-700">
      {title}
    </h2>
    <div className="text-gray-300 space-y-3 leading-relaxed">
      {children}
    </div>
  </section>
);

// ============================================================================
// Callout Component
// ============================================================================

const Callout: React.FC<{
  type: "info" | "tip" | "warning";
  children: React.ReactNode;
}> = ({ type, children }) => {
  const styles = {
    info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    tip: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
  };

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
};

// ============================================================================
// Main Page
// ============================================================================

const AboutPage = () => {
  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">
            About Chessational
          </h1>
          <p className="text-gray-400 text-lg">
            A practice tool for chess opening lines, powered by your Lichess studies.
          </p>
        </div>

        {/* Overview */}
        <Section title="What is this?">
          <p>
            Chessational helps you memorize chess opening lines using <strong className="text-white">spaced repetition</strong>. 
            Import your Lichess studies, and the app will quiz you on lines—prioritizing the ones you 
            struggle with or haven&apos;t seen in a while.
          </p>
          <p>
            You can also import your Chess.com games to see where your actual play differs from your prepared repertoire.
          </p>
          <Callout type="info">
            This is a <strong>review-only</strong> tool. All editing happens on Lichess—just refresh your study here to sync changes.
          </Callout>
        </Section>

        {/* Studies */}
        <Section title="Working with Studies">
          <p>
            Go to the <strong className="text-white">Studies</strong> tab and paste a Lichess study URL or ID. 
            The study must be public. All chapters will be downloaded and stored locally in your browser.
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1 text-gray-400">
            <li><strong className="text-gray-200">Add:</strong> Paste the URL and click Add Study</li>
            <li><strong className="text-gray-200">Refresh:</strong> Re-download a study after making edits on Lichess</li>
            <li><strong className="text-gray-200">Delete:</strong> Remove a study from your browser (doesn&apos;t affect Lichess)</li>
          </ul>
        </Section>

        {/* Lines & Transpositions */}
        <Section title="Lines & Transpositions">
          <p>
            A <strong className="text-white">line</strong> is a sequence of moves from the starting position to a leaf node in your study. 
            You have one move per position; your opponent may have multiple responses, creating branches.
          </p>
          <p>
            The system handles <strong className="text-white">transpositions</strong> intelligently: if a line reaches a position 
            that exists elsewhere in your study (even in another chapter), it follows those continuations automatically. 
            This means maximum practice coverage without duplicating content.
          </p>
        </Section>

        {/* Practice */}
        <Section title="The Practice Quiz">
          <p>
            In the <strong className="text-white">Practice</strong> tab, select your studies and chapters, then click <strong className="text-white">New Line</strong>. 
            The board shows a position—make your move. Correct moves advance the line; incorrect moves are flagged.
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1 text-gray-400">
            <li><strong className="text-gray-200">New Line:</strong> Get a fresh line to practice</li>
            <li><strong className="text-gray-200">Restart Line:</strong> Try the current line again from the beginning</li>
            <li><strong className="text-gray-200">Show Solution:</strong> Reveal the correct move with an arrow</li>
          </ul>
        </Section>

        {/* Spaced Repetition */}
        <Section title="How Lines Are Selected">
          <p>
            Lines aren&apos;t random. The algorithm prioritizes based on:
          </p>
          <ol className="list-decimal list-outside ml-5 space-y-1 text-gray-400">
            <li><strong className="text-gray-200">Never-practiced lines</strong> — new lines you haven&apos;t seen yet</li>
            <li><strong className="text-gray-200">Weak lines</strong> — lines where you&apos;ve made recent mistakes</li>
            <li><strong className="text-gray-200">Stale lines</strong> — lines you haven&apos;t reviewed in a while</li>
          </ol>
          <Callout type="tip">
            If you get a line wrong, it comes back immediately so you can reinforce the correct move while it&apos;s fresh.
          </Callout>
          <p>
            Success rates use <strong className="text-white">time-weighted probability</strong>—recent attempts count more than old ones, 
            modeling how memory actually works. Check the <strong className="text-white">Stats</strong> sub-tab to see your performance per line.
          </p>
        </Section>

        {/* Tree View */}
        <Section title="Tree View">
          <p>
            The <strong className="text-white">Tree</strong> sub-tab in Studies shows your repertoire as an interactive diagram. 
            Click nodes to explore positions. White and Black repertoires are shown in separate tabs.
          </p>
        </Section>

        {/* Games */}
        <Section title="Chess.com Game Analysis">
          <p>
            The <strong className="text-white">Games</strong> tab lets you import games from Chess.com. Enter your username and a date range, 
            and the app downloads your games and builds a move tree.
          </p>
          <p>
            Click <strong className="text-white">Compare to Repertoire</strong> to see:
          </p>
          <ul className="list-disc list-outside ml-5 space-y-1 text-gray-400">
            <li><strong className="text-gray-200">Deviations:</strong> Where <em>you</em> played differently than your prep</li>
            <li><strong className="text-gray-200">Gaps:</strong> Opponent moves that aren&apos;t covered in your repertoire</li>
          </ul>
          <p>
            Use this to identify weak spots in your knowledge and find lines to add to your Lichess study.
          </p>
        </Section>

        {/* Notes */}
        <Section title="Things to Know">
          <div className="space-y-3">
            <Callout type="warning">
              All data is stored in your browser&apos;s IndexedDB. Clearing browser data will remove your studies and practice history. 
              There is no cloud backup.
            </Callout>
            <ul className="list-disc list-outside ml-5 space-y-1 text-gray-400">
              <li>Keep your Lichess studies organized—one for White, one for Black works well</li>
              <li>Practice regularly; even 10-15 minutes daily helps retention</li>
              <li>After analyzing games, go back to Lichess to fill in gaps you discover</li>
            </ul>
          </div>
        </Section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
};

export default AboutPage;
