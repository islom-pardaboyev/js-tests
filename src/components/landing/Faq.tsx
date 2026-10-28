const ITEMS = [
  { q: 'Do I need an account?', a: 'To take a test, yes: email or Google. Verifying a certificate needs no account.' },
  { q: 'What is the pass mark?', a: 'Seventy percent combined across all levels. Pass and you get a certificate.' },
  { q: 'How is it graded?', a: 'In your browser. This is a portfolio demo, so results are practice, not a proctored credential.' },
  { q: 'Can the exam be cheated?', a: 'It deters and detects: full screen, no copy and paste, tab and DevTools detection. A web page cannot stop everything, and the exam says so.' },
  { q: 'What does hard mean here?', a: 'Writing a function in the live editor. Visible tests guide you; hidden tests grade you.' },
  { q: 'Do the questions repeat?', a: 'Each attempt draws its items at random from the bank, so two attempts differ.' },
];

export function Faq() {
  return (
    <section className="container faq" aria-labelledby="faq-title">
      <h2 id="faq-title" className="faq-head">Questions</h2>
      <div className="faq-list">
        {ITEMS.map((i) => (
          <details key={i.q} name="faq">
            <summary><span>{i.q}</span><i aria-hidden="true" /></summary>
            <p>{i.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
