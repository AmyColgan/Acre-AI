export interface Lesson {
  title: string;
  body: string;
  takeaway: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index into options
}

export interface Unit {
  id: string;
  n: number;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  tagline: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

export const LESSON_XP = 20;
export const QUIZ_XP = 50;

export const LEVELS: { name: string; xp: number }[] = [
  { name: "Rookie", xp: 0 },
  { name: "Saver", xp: 150 },
  { name: "Budgeter", xp: 350 },
  { name: "Investor", xp: 600 },
  { name: "Strategist", xp: 900 },
  { name: "Money Master", xp: 1300 },
];

export function levelFor(xp: number) {
  let current = LEVELS[0];
  let next: { name: string; xp: number } | null = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const pct = next ? ((xp - current.xp) / (next.xp - current.xp)) * 100 : 100;
  return { current, next, pct };
}

export const UNITS: Unit[] = [
  {
    id: "u1",
    n: 1,
    title: "Money Basics",
    level: "Beginner",
    tagline: "What money actually does — and why it flows away from people who don't watch it.",
    lessons: [
      {
        title: "The three jobs of money",
        body: "Money does exactly three things: it comes in (income), it goes out (spending), and whatever survives can grow (saving and investing). Every financial decision you will ever make is really a decision about which of these three jobs a dollar should do. People who feel 'bad with money' usually just never see the three flows separately — the paycheck arrives, the month happens, and whatever is left feels random.",
        takeaway: "Track the three flows separately and money stops feeling random.",
      },
      {
        title: "Earning: your first money engine",
        body: "For most of your life, income starts with trading time for money — a job, a side gig, freelancing. Two numbers matter from day one: what you earn per hour of your life, and what percentage of it you keep. A $50 sneaker costs about 5 hours at $10/hour after taxes. Pricing purchases in hours of your life, not dollars, is the single fastest way to make spending decisions feel real.",
        takeaway: "Price things in hours of your life, not just dollars.",
      },
      {
        title: "Spending: needs, wants, and the invisible leak",
        body: "A need keeps you alive and functioning: housing, food, transport to work or school. A want is everything else — and wants are fine! The trap isn't wanting things; it's the invisible leak: small automatic spending (snacks, in-app purchases, subscriptions) that never gets a decision. A $6 daily habit is $2,190 a year. Naming the leak is 90% of fixing it.",
        takeaway: "Small automatic spending is the leak — name it and it shrinks.",
      },
    ],
    quiz: [
      {
        q: "What are the three jobs a dollar can do?",
        options: ["Earn, borrow, repay", "Come in, go out, grow", "Save, spend, gift", "Cash, card, crypto"],
        answer: 1,
      },
      {
        q: "You earn $12/hour after taxes. Roughly how many hours of your life does a $96 purchase cost?",
        options: ["4 hours", "8 hours", "12 hours", "1 hour"],
        answer: 1,
      },
      {
        q: "Which of these is the classic 'invisible leak'?",
        options: ["Rent going up", "A broken phone", "Small automatic purchases you never decide on", "A yearly insurance bill"],
        answer: 2,
      },
    ],
  },
  {
    id: "u2",
    n: 2,
    title: "Budgeting 101",
    level: "Beginner",
    tagline: "A budget isn't a punishment — it's permission to spend without guilt.",
    lessons: [
      {
        title: "The 50/30/20 starting point",
        body: "The simplest working budget splits take-home pay three ways: about 50% to needs, 30% to wants, and 20% to saving and future-you. It's not a law — a student might run 70/20/10, a high earner 40/20/40 — but it gives every dollar a job before the month starts. Pulse's own budget screen is a 50/30/20 machine with better labels: fixed expenses, variable spending, and your savings plan.",
        takeaway: "Give every dollar a job before the month starts.",
      },
      {
        title: "Pay yourself first",
        body: "The most reliable trick in personal finance: move savings out on payday, before you can spend it. Willpower budgets fail because they ask you to say 'no' thirty times a month; automation asks you to say 'yes' once. If you save whatever is left at the end of the month, the answer is usually nothing — the order of operations is the whole game.",
        takeaway: "Automate savings on payday; never save 'what's left over.'",
      },
      {
        title: "The weekly safe-to-spend number",
        body: "Monthly budgets fail on day 22 when you can't remember what's left. A weekly number fixes that: take your monthly flexible budget, subtract what's spent, divide by the weeks remaining. That's one number you can hold in your head at a checkout counter. It's exactly the 'Safe to Spend This Week' number on the Pulse dashboard — now you know how it's computed.",
        takeaway: "One weekly number beats thirty daily guilt-checks.",
      },
    ],
    quiz: [
      {
        q: "In a 50/30/20 budget, the 20 goes to…",
        options: ["Wants", "Rent", "Saving and future-you", "Subscriptions"],
        answer: 2,
      },
      {
        q: "'Pay yourself first' means…",
        options: [
          "Buy something nice on payday",
          "Move money to savings before you can spend it",
          "Pay all bills before eating out",
          "Ask for a raise every year",
        ],
        answer: 1,
      },
      {
        q: "Your flexible budget is $400/month, you've spent $250, and two weeks remain. Safe-to-spend per week?",
        options: ["$150", "$125", "$75", "$50"],
        answer: 2,
      },
    ],
  },
  {
    id: "u3",
    n: 3,
    title: "Saving & Emergency Funds",
    level: "Beginner",
    tagline: "The fund that turns a crisis into an inconvenience.",
    lessons: [
      {
        title: "Why emergencies break budgets",
        body: "A car repair, a phone screen, a lost job — surprise costs are the number one reason people fall into expensive debt. Not because the costs are huge, but because they arrive without warning and demand cash now. An emergency fund is pre-decided money: when the surprise comes, the decision is already made, and no credit card gets involved.",
        takeaway: "Emergencies are certain; only their timing is a surprise.",
      },
      {
        title: "How big, and where to keep it",
        body: "Milestone one is $500 — that covers most single surprises. Milestone two is one month of expenses. The full target is three to six months, which turns even a job loss into a runway instead of a freefall. Keep it in a separate high-yield savings account: separate so you don't spend it, high-yield so it earns ~4% instead of ~0%, and savings (not investments) so it can't drop 20% the week you need it.",
        takeaway: "$500 → 1 month → 3–6 months, in a separate high-yield account.",
      },
      {
        title: "Making saving automatic and visible",
        body: "Two forces make savings actually grow: automation (a payday transfer you never see) and visibility (a progress bar you check). Progress you can see is motivating in a way numbers in a statement never are — it's why Pulse draws a ring for every goal. Small consistent beats large occasional: $25 every week outruns $200 'whenever I remember' in almost every real life.",
        takeaway: "Automatic + visible + consistent beats big and occasional.",
      },
    ],
    quiz: [
      {
        q: "The main purpose of an emergency fund is to…",
        options: [
          "Earn the highest possible return",
          "Turn surprises into pre-decided money instead of debt",
          "Pay for vacations",
          "Impress a bank",
        ],
        answer: 1,
      },
      {
        q: "The best home for an emergency fund is…",
        options: ["Stocks", "Cash under a mattress", "A separate high-yield savings account", "Your checking account"],
        answer: 2,
      },
      {
        q: "Which savings habit wins over a year, in real life?",
        options: ["$200 whenever you remember", "$25 automatically every week", "Saving only bonuses", "Rounding up purchases"],
        answer: 1,
      },
    ],
  },
  {
    id: "u4",
    n: 4,
    title: "Banking & Compound Interest",
    level: "Intermediate",
    tagline: "The quiet force that makes money grow — or debt explode.",
    lessons: [
      {
        title: "Accounts, and what banks pay you",
        body: "Checking is for money in motion (bills, spending); savings is for money at rest. Banks pay interest for holding your money, quoted as APY — annual percentage yield. Big traditional banks often pay ~0.01–0.5%; online high-yield accounts pay ~4%+. Same insurance (FDIC up to $250,000), radically different outcome: on $7,850, that's the difference between about $8 a year and about $345.",
        takeaway: "APY is the price a bank pays for your money — shop for it.",
      },
      {
        title: "Compound interest: earning on your earnings",
        body: "Simple interest pays you on your deposit. Compound interest pays you on your deposit plus every previous interest payment — growth on growth. $1,000 at 7% becomes $1,070 in year one, but year two starts from $1,070, not $1,000. Left alone for 30 years it becomes about $7,600 without a single extra deposit. Time in the machine matters more than the size of the first deposit.",
        takeaway: "Compounding pays you on your past earnings — time is the fuel.",
      },
      {
        title: "The Rule of 72",
        body: "Quick mental math for compounding: divide 72 by the annual return to get the years it takes money to double. At 8%, money doubles every ~9 years; at 3%, every ~24. It works in reverse for debt: a credit card at 24% doubles what you owe roughly every 3 years if unpaid. The same force that builds wealth on one side of the ledger demolishes it on the other.",
        takeaway: "72 ÷ rate ≈ years to double — for savings and for debt.",
      },
    ],
    quiz: [
      {
        q: "APY measures…",
        options: [
          "The fee a bank charges yearly",
          "The yearly interest your money earns, with compounding",
          "Your credit score",
          "The monthly minimum balance",
        ],
        answer: 1,
      },
      {
        q: "Compound interest means you earn interest on…",
        options: ["Only your deposits", "Your deposits plus previous interest", "Your income", "Your bank's profits"],
        answer: 1,
      },
      {
        q: "Using the Rule of 72: at an 8% return, money doubles about every…",
        options: ["4 years", "9 years", "15 years", "72 years"],
        answer: 1,
      },
    ],
  },
  {
    id: "u5",
    n: 5,
    title: "Credit & Debt",
    level: "Intermediate",
    tagline: "Borrowed money is a tool with a price tag — learn to read the tag.",
    lessons: [
      {
        title: "How credit works, and what a score is",
        body: "Credit is borrowing with a promise to repay, and a credit score (300–850) is the record of how well you keep that promise. It's built from payment history (~35%), how much of your limit you use (~30%), account age, new applications, and mix. A good score isn't about being rich — it's about being predictable: pay on time, every time, and keep balances well under your limits.",
        takeaway: "A credit score measures predictability, not wealth.",
      },
      {
        title: "APR: the price of borrowed money",
        body: "APR is what borrowing costs per year. The range is enormous: federal student loans ~5–8%, car loans ~7–10%, credit cards ~20–28%. A $3,200 card balance at 24.99% costs about $66 every month in pure interest — money that buys you nothing. That's why the demo profile in this app treats its Sapphire card as a fire to put out while treating the 6.2% student loan as a schedule to keep.",
        takeaway: "Interest is rent you pay on money — know your rate.",
      },
      {
        title: "Avalanche vs. snowball payoff",
        body: "Two proven payoff strategies: the avalanche sends every extra dollar to the highest-APR debt first (mathematically cheapest), while the snowball attacks the smallest balance first (psychologically strongest — quick wins keep you going). Both work; the one you'll actually stick with is the right one. Either way, minimum payments on everything else are non-negotiable.",
        takeaway: "Avalanche saves the most money; snowball saves the most motivation.",
      },
    ],
    quiz: [
      {
        q: "The biggest ingredient in a credit score is…",
        options: ["Your income", "Paying on time, every time", "How many cards you own", "Your age"],
        answer: 1,
      },
      {
        q: "A $3,200 balance at 24.99% APR costs roughly how much per month in pure interest?",
        options: ["$6", "$27", "$66", "$320"],
        answer: 2,
      },
      {
        q: "The 'avalanche' method pays extra toward…",
        options: ["The smallest balance", "The newest debt", "The highest-interest-rate debt", "The largest balance"],
        answer: 2,
      },
    ],
  },
  {
    id: "u6",
    n: 6,
    title: "Investing Foundations",
    level: "Intermediate",
    tagline: "Owning slices of the economy — the engine of long-term wealth.",
    lessons: [
      {
        title: "Stocks, bonds, and funds",
        body: "A stock is a slice of ownership in one company — high potential, high drama. A bond is a loan to a company or government — steadier, smaller returns. A fund is a basket holding hundreds of them at once. Index funds are baskets that simply hold the whole market at very low cost, which is why they beat most professional stock-pickers over long periods and why they're the default recommendation for beginners.",
        takeaway: "Funds spread the risk; index funds do it cheapest.",
      },
      {
        title: "Risk and return are the same dial",
        body: "There is no high return without risk — anyone promising otherwise is selling something. Stocks average ~7–10% a year over decades but can drop 30% in a bad year; bonds average less but swing less. The dial you control is allocation: how much growth (stocks) versus defense (bonds, cash). Your timeline sets the dial — money needed in 3 years shouldn't ride the stock market; money for 30 years from now shouldn't sit in cash.",
        takeaway: "Timeline sets the risk dial, not courage.",
      },
      {
        title: "Time in the market beats timing the market",
        body: "Missing just the 10 best days in the market over 20 years roughly halves your final result — and the best days cluster right next to the worst ones, so dodging crashes reliably is a fantasy. The winning strategy is boring: invest a fixed amount on a schedule (dollar-cost averaging), through every mood the market has. The $300/month contribution in this app's demo is exactly that strategy.",
        takeaway: "Scheduled, boring investing outruns clever timing.",
      },
    ],
    quiz: [
      {
        q: "An index fund is…",
        options: [
          "A bet on one hot company",
          "A low-cost basket holding the whole market",
          "A savings account",
          "A government loan",
        ],
        answer: 1,
      },
      {
        q: "Money you'll need in 3 years belongs mostly in…",
        options: ["Individual stocks", "Crypto", "Savings/bonds — low-swing assets", "A 30-year retirement fund"],
        answer: 2,
      },
      {
        q: "'Dollar-cost averaging' means…",
        options: [
          "Buying only when prices drop",
          "Investing a fixed amount on a fixed schedule",
          "Converting dollars to other currencies",
          "Selling after every gain",
        ],
        answer: 1,
      },
    ],
  },
  {
    id: "u7",
    n: 7,
    title: "Taxes & Paychecks",
    level: "Advanced",
    tagline: "Where a third of your paycheck goes — and how to keep more of it legally.",
    lessons: [
      {
        title: "Gross vs. net: reading a pay stub",
        body: "Gross pay is what you earn; net pay is what arrives. In between: federal income tax, state tax (in most states), and FICA — Social Security (6.2%) plus Medicare (1.45%). A $4,000 gross month commonly nets around $3,200. Every budget in the world should be built on net, and every salary negotiation should remember the difference — a $5,000 raise is roughly $290/month in your pocket, not $415.",
        takeaway: "Budget on net pay; negotiate knowing the gap.",
      },
      {
        title: "Brackets: how income tax actually works",
        body: "The most misunderstood idea in personal finance: moving into a higher tax bracket does not tax all your income at the higher rate. Brackets are marginal — only the dollars above each threshold pay that threshold's rate. Earning one more dollar can never reduce your take-home pay. Turning down a raise 'to stay in a lower bracket' is mathematically always a mistake.",
        takeaway: "Only the dollars above a bracket line pay that bracket's rate.",
      },
      {
        title: "Tax-advantaged accounts: legal head starts",
        body: "Governments reward long-term saving with special accounts. A 401(k) takes money pre-tax (and employer matches are literally free salary — always take the match). A Roth IRA takes taxed money now, then all growth comes out tax-free in retirement — spectacular for young people in low brackets. An HSA, where eligible, is triple tax-free. These aren't loopholes; they're the intended path.",
        takeaway: "Take the match, know Roth vs. traditional, use the intended paths.",
      },
    ],
    quiz: [
      {
        q: "FICA on your pay stub pays for…",
        options: ["State roads", "Social Security and Medicare", "Federal income tax", "Your 401(k)"],
        answer: 1,
      },
      {
        q: "Moving into a higher tax bracket means…",
        options: [
          "All your income is taxed at the higher rate",
          "Only dollars above the threshold are taxed at the higher rate",
          "Your take-home pay can drop",
          "You should refuse raises",
        ],
        answer: 1,
      },
      {
        q: "An employer 401(k) match is best described as…",
        options: ["A tax", "A loan", "Free salary you must opt into", "A gamble"],
        answer: 2,
      },
    ],
  },
  {
    id: "u8",
    n: 8,
    title: "Wealth Strategy",
    level: "Advanced",
    tagline: "College-level capstone: net worth, asset allocation, and the time value of money.",
    lessons: [
      {
        title: "Net worth: the one honest number",
        body: "Net worth = everything you own minus everything you owe. Income is a flow; net worth is the stock — and it's the stock that measures financial progress. Someone earning $60k who keeps $10k a year builds wealth faster than someone earning $200k who keeps nothing. Track it monthly, expect it to move slowly, and treat every decision as a question: does this raise or lower the line?",
        takeaway: "Wealth is what you keep, not what you make.",
      },
      {
        title: "Asset allocation and rebalancing",
        body: "Decades of research (Markowitz's portfolio theory, for the college reading list) says your mix of asset classes — US stocks, international stocks, bonds, cash, alternatives — explains most of your portfolio's behavior, far more than picking winners. A classic aggressive-young allocation is 80–90% global stocks. Once a year, rebalance: sell a little of what grew, buy what shrank. It's systematic buy-low-sell-high with zero forecasting.",
        takeaway: "The mix drives the outcome; rebalancing enforces discipline.",
      },
      {
        title: "The time value of money",
        body: "The core equation of finance: a dollar today is worth more than a dollar tomorrow, because today's dollar can compound. Formally, future value = PV × (1+r)ⁿ — the same math behind every mortgage, retirement projection, and the 10-year chart on this app's Investments page. Its most important consequence for you: starting at 18 versus 28 can double a retirement outcome, even with identical monthly contributions. The strategy of wealth is mostly the strategy of starting.",
        takeaway: "FV = PV × (1+r)ⁿ — and n is the variable you control by starting now.",
      },
    ],
    quiz: [
      {
        q: "Net worth equals…",
        options: ["Annual income", "Assets minus liabilities", "Savings plus income", "Investments only"],
        answer: 1,
      },
      {
        q: "Research says most of a portfolio's long-run behavior is explained by…",
        options: ["Stock picking", "Market timing", "Asset allocation", "Fees alone"],
        answer: 2,
      },
      {
        q: "Two people invest $300/month at the same return. One starts at 18, one at 28. At 60, the early starter has…",
        options: ["About the same", "Slightly more", "Roughly double or more", "Less, due to fees"],
        answer: 2,
      },
    ],
  },
];
