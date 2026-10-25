# Subject catalogue. The scope and rubrics are fed straight into the AI prompt (Phase 3),
# so editing them tunes question quality. Re-running seed.py updates existing rows by slug.
#
# Difficulty rules:
# - Technical subjects: Easy = theory, Medium = applied/code reading, Hard = debugging/edge cases/trade-offs.
# - Aptitude and English: difficulty = complexity (number of steps, passage length, inference).

TECH_EASY = "Theory only: definitions, core concepts and 'what is / why' questions. No code to trace."
TECH_MEDIUM = "Applied: read a short snippet or scenario and pick the output, behaviour or right construct."
TECH_HARD = "Technical depth: debugging, edge cases, performance or design trade-offs, usually with a code snippet."

SUBJECTS = [
    # Aptitude
    {
        "slug": "logical-reasoning",
        "name": "Logical Reasoning",
        "group_name": "Aptitude",
        "scope": "Number and letter series, analogies, coding-decoding, blood relations, direction sense, "
                 "seating arrangements, syllogisms, statement-conclusion, odd one out.",
        "easy_rubric": "Single-step pattern or relation: simple series, direct analogies, odd one out.",
        "medium_rubric": "Two to three steps: coding-decoding, blood relations, direction sense, simple syllogisms.",
        "hard_rubric": "Multi-step puzzles with several constraints (seating, scheduling), multi-statement syllogisms. "
                       "Exactly one arrangement must satisfy all constraints.",
    },
    {
        "slug": "quantitative-aptitude",
        "name": "Quantitative Aptitude",
        "group_name": "Aptitude",
        "scope": "Percentages, ratios, averages, profit and loss, simple and compound interest, time and work, "
                 "time-speed-distance, number properties, basic probability.",
        "easy_rubric": "Single calculation with small numbers (a percentage, an average, a speed).",
        "medium_rubric": "Two-step word problems: profit percentage, ratio splits, simple interest.",
        "hard_rubric": "Multi-step word problems combining concepts (work done in stages, compound interest, "
                       "relative speed, probability). Answer must be exact.",
    },
    {
        "slug": "english-comprehension",
        "name": "English Comprehension",
        "group_name": "Aptitude",
        "scope": "Reading comprehension, vocabulary (synonyms, antonyms), grammar and punctuation, "
                 "sentence correction, inference, tone and main idea.",
        "easy_rubric": "Vocabulary or a one-sentence passage with a directly stated answer.",
        "medium_rubric": "Two to three sentence passage asking for the main point, or grammar and punctuation choices.",
        "hard_rubric": "Passage of four or more sentences asking for inference, implication or the best-supported "
                       "conclusion. Include the full passage inside the question text.",
    },
    # CS Fundamentals
    {
        "slug": "cs-fundamentals",
        "name": "Computer Science Fundamentals",
        "group_name": "CS Fundamentals",
        "scope": "Computer architecture basics, number systems (binary, hex, two's complement), memory hierarchy, "
                 "compilers vs interpreters, Boolean logic, complexity basics, parallelism basics.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: number system conversions, memory hierarchy comparisons, logic evaluation.",
        "hard_rubric": "Technical depth: two's complement, Amdahl's law, cache behaviour, precise representation questions.",
    },
    {
        "slug": "data-structures-algorithms",
        "name": "Data Structures & Algorithms",
        "group_name": "CS Fundamentals",
        "scope": "Arrays, linked lists, stacks, queues, hash tables, trees, heaps, graphs, sorting, searching, "
                 "recursion, Big-O complexity, dynamic programming basics.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: trace short recursive or iterative code, pick complexity of a standard algorithm.",
        "hard_rubric": "Technical depth: complexity of nested or logarithmic loops, algorithm trade-offs "
                       "(stability, in-place, worst case), choosing the right structure.",
    },
    {
        "slug": "oop",
        "name": "Object-Oriented Programming",
        "group_name": "CS Fundamentals",
        "scope": "Classes and objects, encapsulation, inheritance, polymorphism, abstraction, interfaces, "
                 "overloading vs overriding, composition, SOLID principles. Code examples in Python or Java.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: predict output of method overriding or polymorphic calls in a short snippet.",
        "hard_rubric": "Technical depth: method resolution order, SOLID violations, design trade-offs "
                       "(inheritance vs composition).",
    },
    {
        "slug": "operating-systems",
        "name": "Operating Systems",
        "group_name": "CS Fundamentals",
        "scope": "Processes and threads, CPU scheduling, synchronisation, deadlocks, memory management, paging, "
                 "virtual memory, page replacement, file systems.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: compute waiting time for a scheduling algorithm, identify deadlock conditions.",
        "hard_rubric": "Technical depth: page table sizing, page replacement fault counts, race conditions. "
                       "Numeric answers must be exact.",
    },
    {
        "slug": "computer-networks",
        "name": "Computer Networks",
        "group_name": "CS Fundamentals",
        "scope": "OSI and TCP/IP models, IP addressing and subnetting, TCP vs UDP, DNS, HTTP/HTTPS, routing basics, "
                 "TCP handshake and flow control.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: usable hosts in a subnet, choosing the right protocol for a scenario.",
        "hard_rubric": "Technical depth: network address calculation, TCP sequence/ack numbers, protocol behaviour "
                       "in edge cases.",
    },
    # Programming Languages
    {
        "slug": "python",
        "name": "Python",
        "group_name": "Programming Languages",
        "scope": "Syntax, data types, mutability, lists/dicts/sets/tuples, slicing, comprehensions, functions, "
                 "closures, generators, decorators, classes, exceptions, standard library basics.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: predict the output of short snippets (slicing, references, comprehensions).",
        "hard_rubric": "Technical depth: mutable default arguments, late binding in closures, generator behaviour, "
                       "scoping rules, subtle bugs.",
    },
    {
        "slug": "javascript",
        "name": "JavaScript",
        "group_name": "Programming Languages",
        "scope": "var/let/const, types and coercion, functions and closures, this, prototypes, arrays and objects, "
                 "promises, async/await, event loop, ES6+ features.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: predict output involving coercion, array methods, destructuring.",
        "hard_rubric": "Technical depth: event loop ordering (microtasks vs macrotasks), closures in loops, "
                       "this binding, async error handling.",
    },
    {
        "slug": "typescript",
        "name": "TypeScript",
        "group_name": "Programming Languages",
        "scope": "Type annotations, interfaces vs types, unions and narrowing, generics, utility types "
                 "(Partial, Pick, Required, Record), unknown vs any, enums, type inference.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: infer the type of an expression, pick valid assignments for a type.",
        "hard_rubric": "Technical depth: evaluate utility and conditional types, explain compile errors, narrowing rules.",
    },
    {
        "slug": "java",
        "name": "Java",
        "group_name": "Programming Languages",
        "scope": "Syntax, primitives vs objects, String handling, OOP in Java, collections, generics, exceptions, "
                 "equals/hashCode, basic concurrency, Java 8+ features.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: predict output (== vs equals, increment operators, string behaviour).",
        "hard_rubric": "Technical depth: collection behaviour (ConcurrentModificationException, HashMap rules), "
                       "concurrency pitfalls, exception edge cases.",
    },
    # Frontend
    {
        "slug": "html",
        "name": "HTML",
        "group_name": "Frontend",
        "scope": "Document structure, semantic elements, forms and input types, links and media, accessibility "
                 "(labels, alt text, ARIA basics), script loading.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: choose the right element or input type for a scenario.",
        "hard_rubric": "Technical depth: form default behaviours, script defer/async, accessibility correctness.",
    },
    {
        "slug": "css",
        "name": "CSS",
        "group_name": "Frontend",
        "scope": "Selectors and specificity, box model, display and positioning, flexbox, grid, responsive design, "
                 "units, stacking context and z-index, transitions.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: compute rendered sizes, compare selector specificity, predict flex/grid layout.",
        "hard_rubric": "Technical depth: stacking contexts, grid auto-fill/minmax, layout bugs and their causes.",
    },
    {
        "slug": "react",
        "name": "React",
        "group_name": "Frontend",
        "scope": "Components, JSX, props, state, rendering and re-rendering, lists and keys, conditional rendering, "
                 "events, context, memoisation, Strict Mode, component patterns.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: predict what a short component renders, explain list keys or conditional rendering.",
        "hard_rubric": "Technical depth: unnecessary re-renders, React.memo and referential equality, "
                       "rendering edge cases.",
    },
    {
        "slug": "react-hooks",
        "name": "React Hooks",
        "group_name": "Frontend",
        "scope": "useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer, custom hooks, "
                 "rules of hooks, dependency arrays.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: predict state after batched updates, explain dependency array behaviour.",
        "hard_rubric": "Technical depth: stale closures, effect cleanup, memoisation pitfalls, dependency bugs.",
    },
    # Backend
    {
        "slug": "nodejs-express",
        "name": "Node.js & Express",
        "group_name": "Backend",
        "scope": "Node runtime and event loop, modules, npm, async I/O, streams basics, Express routing, "
                 "middleware, error handling, request/response lifecycle.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: middleware flow with next(), output order of async I/O snippets.",
        "hard_rubric": "Technical depth: error-handling middleware, async errors in Express, blocking the event loop.",
    },
    {
        "slug": "rest-apis",
        "name": "REST APIs",
        "group_name": "Backend",
        "scope": "HTTP methods, status codes, resource design, idempotency, authentication vs authorisation, "
                 "pagination, versioning, caching headers.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: pick the right method or status code for a scenario.",
        "hard_rubric": "Technical depth: idempotency guarantees, 401 vs 403, pagination consistency, API design trade-offs.",
    },
    # Databases
    {
        "slug": "databases",
        "name": "Databases",
        "group_name": "Databases",
        "scope": "General database concepts across SQL (PostgreSQL, MySQL) and NoSQL (MongoDB): keys, "
                 "normalisation, relationships, indexes, transactions and ACID, isolation levels, "
                 "SQL vs NoSQL trade-offs.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: model relationships, explain ACID properties in a scenario.",
        "hard_rubric": "Technical depth: index choice, concurrency and isolation behaviour, schema design trade-offs.",
    },
    {
        "slug": "sql",
        "name": "SQL",
        "group_name": "Databases",
        "scope": "SELECT, WHERE, JOINs, GROUP BY and HAVING, aggregates, subqueries, NULL handling, window functions, "
                 "INSERT/UPDATE/DELETE, constraints.",
        "easy_rubric": "Theory only: what each clause or statement does.",
        "medium_rubric": "Applied: read a query and pick what it returns, row counts of joins.",
        "hard_rubric": "Technical depth: NULL semantics, correlated subqueries, window functions, tricky query results.",
    },
    {
        "slug": "mongodb",
        "name": "MongoDB",
        "group_name": "Databases",
        "scope": "Documents and collections, BSON, CRUD queries and operators, update operators, indexes, "
                 "aggregation pipeline, embedding vs referencing.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: pick the right query or explain what an update does.",
        "hard_rubric": "Technical depth: aggregation pipelines, schema design (embed vs reference), index behaviour.",
    },
    # AI / ML
    {
        "slug": "machine-learning",
        "name": "Machine Learning",
        "group_name": "AI / ML",
        "scope": "Supervised vs unsupervised learning, regression and classification, overfitting, "
                 "train/validation/test splits, evaluation metrics, feature engineering, common algorithms.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: diagnose over/underfitting from results, choose a metric for a scenario.",
        "hard_rubric": "Technical depth: compute metrics (F1, precision, recall), data leakage, bias-variance trade-offs.",
    },
    {
        "slug": "deep-learning",
        "name": "Deep Learning",
        "group_name": "AI / ML",
        "scope": "Neural networks, activation functions, backpropagation, optimisers, regularisation, CNNs, RNNs, "
                 "transformers and attention, training dynamics.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: compute layer output shapes, compare activation functions.",
        "hard_rubric": "Technical depth: training diagnostics, attention internals, vanishing/exploding gradients.",
    },
    # Tools
    {
        "slug": "git",
        "name": "Git",
        "group_name": "Tools",
        "scope": "Repositories, commits, branches, merging, rebasing, remotes, fetch vs pull, undoing changes "
                 "(reset, revert, amend), conflicts.",
        "easy_rubric": TECH_EASY,
        "medium_rubric": "Applied: pick the right command for a scenario.",
        "hard_rubric": "Technical depth: rewriting shared history, recovering from mistakes, rebase vs merge trade-offs.",
    },
]
