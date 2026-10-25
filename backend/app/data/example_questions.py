# Starter example question bank: 2 questions per subject per difficulty.
# Used as AI style examples (Phase 3) and as the stand-in generator source (Phase 2).
# Each entry stores the correct answer separately; seed.py places it at a rotating
# position (a-d) so answer letters are evenly spread.


def Q(subject, difficulty, question, correct, *incorrect):
    assert len(incorrect) == 3, f"{subject}: need exactly 3 incorrect options"
    return {
        "subject": subject,
        "difficulty": difficulty,
        "question": question.strip(),
        "correct": correct,
        "incorrect": list(incorrect),
    }


EXAMPLE_QUESTIONS = [
    # ---------------- Logical Reasoning ----------------
    Q("logical-reasoning", "Easy",
      "Find the next number in the series: 2, 6, 12, 20, 30, ?",
      "42", "40", "44", "36"),
    Q("logical-reasoning", "Easy",
      "Book is to Reading as Fork is to:",
      "Eating", "Kitchen", "Spoon", "Metal"),
    Q("logical-reasoning", "Medium",
      "In a certain code, CAT is written as DBU. How is DOG written in that code?",
      "EPH", "EOH", "CNF", "EPG"),
    Q("logical-reasoning", "Medium",
      "A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?",
      "Uncle", "Father", "Grandfather", "Cousin"),
    Q("logical-reasoning", "Hard",
      "Five friends P, Q, R, S and T sit in a row facing north. R sits at the extreme left end. "
      "S sits exactly in the middle. Q sits immediately to the right of P. T sits next to R. "
      "Who sits at the extreme right end?",
      "Q", "P", "S", "T"),
    Q("logical-reasoning", "Hard",
      "Statements: No doctor is a lawyer. All lawyers are writers.\n"
      "Conclusions: I. No writer is a doctor. II. Some writers are not doctors.\n"
      "Which conclusion(s) follow?",
      "Only II follows", "Only I follows", "Both I and II follow", "Neither I nor II follows"),

    # ---------------- Quantitative Aptitude ----------------
    Q("quantitative-aptitude", "Easy",
      "What is 15% of 240?",
      "36", "32", "38", "40"),
    Q("quantitative-aptitude", "Easy",
      "A car travels 180 km in 3 hours. What is its average speed?",
      "60 km/h", "50 km/h", "54 km/h", "65 km/h"),
    Q("quantitative-aptitude", "Medium",
      "A shopkeeper buys an item for Rs. 800 and sells it for Rs. 1,000. What is the profit percentage?",
      "25%", "20%", "22.5%", "30%"),
    Q("quantitative-aptitude", "Medium",
      "The ratio of boys to girls in a class is 3:5. If there are 40 students, how many girls are there?",
      "25", "15", "20", "24"),
    Q("quantitative-aptitude", "Hard",
      "A can complete a job in 12 days and B can complete it in 18 days. They work together for 4 days, "
      "then A leaves. How many more days will B take to finish the remaining work?",
      "8 days", "6 days", "7 days", "10 days"),
    Q("quantitative-aptitude", "Hard",
      "A sum of money doubles itself in 5 years at simple interest. In how many years will it become "
      "four times itself at the same rate?",
      "15 years", "10 years", "20 years", "12 years"),

    # ---------------- English Comprehension ----------------
    Q("english-comprehension", "Easy",
      "Choose the word closest in meaning to 'abundant'.",
      "Plentiful", "Scarce", "Tiny", "Hidden"),
    Q("english-comprehension", "Easy",
      "Passage: \"Maria missed the bus, so she walked to school and arrived late.\"\n"
      "Why did Maria arrive late?",
      "She missed the bus and had to walk", "She overslept", "School started early", "She took the wrong bus"),
    Q("english-comprehension", "Medium",
      "Passage: \"Although the new policy was intended to reduce traffic, many residents argued that it "
      "simply moved congestion to neighbouring streets.\"\n"
      "What is the residents' main criticism of the policy?",
      "It shifted the traffic problem instead of solving it",
      "It increased the number of cars in the city",
      "It was never put into effect",
      "It reduced traffic on every street"),
    Q("english-comprehension", "Medium",
      "Choose the correctly punctuated sentence.",
      "It's a beautiful day, isn't it?",
      "Its a beautiful day, isn't it?",
      "Its' a beautiful day isnt it?",
      "It's a beautiful day isn't, it?"),
    Q("english-comprehension", "Hard",
      "Passage: \"For decades, the town relied on its textile mill. When the mill closed, unemployment rose "
      "sharply, yet within ten years the town's population had grown. Former mill buildings became studios "
      "and offices, attracting young entrepreneurs who valued the low rents and the town's proximity to the "
      "city.\"\n"
      "Which conclusion is best supported by the passage?",
      "The town grew again by reusing its old industrial buildings for new businesses",
      "The textile mill reopened after ten years",
      "Unemployment in the town is still high today",
      "Young entrepreneurs caused the mill to close"),
    Q("english-comprehension", "Hard",
      "Passage: \"Critics praised the novel's ambition but found its ending abrupt; several noted that the "
      "final chapter resolved, in three pages, conflicts that had taken three hundred to build.\"\n"
      "What does the passage imply about the novel's ending?",
      "It resolved the story's conflicts too quickly compared with how long they took to build",
      "It was longer than the rest of the book",
      "Critics found it unambitious but well paced",
      "It left the main conflicts unresolved"),

    # ---------------- Computer Science Fundamentals ----------------
    Q("cs-fundamentals", "Easy",
      "What does CPU stand for?",
      "Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Control Processing Unit"),
    Q("cs-fundamentals", "Easy",
      "How many bits are there in one byte?",
      "8", "4", "16", "32"),
    Q("cs-fundamentals", "Medium",
      "What is the decimal value of the binary number 101101?",
      "45", "43", "47", "53"),
    Q("cs-fundamentals", "Medium",
      "Compared with secondary storage such as an SSD, main memory (RAM) is:",
      "Volatile and faster", "Non-volatile and slower", "Cheaper per gigabyte", "Able to keep data after power off"),
    Q("cs-fundamentals", "Hard",
      "What is the 8-bit two's complement representation of -5?",
      "11111011", "10000101", "11111010", "11111101"),
    Q("cs-fundamentals", "Hard",
      "40% of a program's run time is spent in code that can be parallelised perfectly; the rest is serial. "
      "According to Amdahl's law, what is the maximum overall speedup with unlimited processors?",
      "About 1.67x", "1.4x", "2.5x", "Unlimited"),

    # ---------------- Data Structures & Algorithms ----------------
    Q("data-structures-algorithms", "Easy",
      "Which data structure follows the Last-In-First-Out (LIFO) principle?",
      "Stack", "Queue", "Linked list", "Binary tree"),
    Q("data-structures-algorithms", "Easy",
      "What is the time complexity of accessing an element by index in an array?",
      "O(1)", "O(log n)", "O(n)", "O(n log n)"),
    Q("data-structures-algorithms", "Medium",
      "What is the worst-case time complexity of binary search on a sorted array of n elements?",
      "O(log n)", "O(1)", "O(n)", "O(n log n)"),
    Q("data-structures-algorithms", "Medium",
      """What does this function return for n = 5?
```python
def f(n):
    if n <= 1:
        return 1
    return n * f(n - 1)
```""",
      "120", "24", "15", "720"),
    Q("data-structures-algorithms", "Hard",
      "Which sorting algorithm has a worst-case time of O(n log n) and sorts in place using O(1) extra space?",
      "Heap sort", "Merge sort", "Quick sort", "Counting sort"),
    Q("data-structures-algorithms", "Hard",
      """What is the time complexity of this code?
```python
for i in range(n):
    j = 1
    while j < n:
        j *= 2
```""",
      "O(n log n)", "O(n)", "O(n^2)", "O(log n)"),

    # ---------------- Object-Oriented Programming ----------------
    Q("oop", "Easy",
      "Which OOP principle keeps an object's internal state private and exposes behaviour through methods?",
      "Encapsulation", "Inheritance", "Polymorphism", "Recursion"),
    Q("oop", "Easy",
      "What is a class in object-oriented programming?",
      "A blueprint for creating objects", "An instance of an object", "A function that returns values",
      "A variable that stores data"),
    Q("oop", "Medium",
      """What is printed?
```python
class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "Woof"

animals = [Animal(), Dog()]
print([a.speak() for a in animals])
```""",
      "['...', 'Woof']", "['...', '...']", "['Woof', 'Woof']", "An error is raised"),
    Q("oop", "Medium",
      "Which statement best describes method overloading (as in Java)?",
      "Several methods in the same class share a name but have different parameter lists",
      "A subclass redefines a parent method with the same signature",
      "A method that calls itself",
      "Hiding fields with private access"),
    Q("oop", "Hard",
      "A subclass overrides a method and throws an exception for inputs the parent class accepted. "
      "Which SOLID principle does this violate?",
      "Liskov Substitution Principle", "Single Responsibility Principle", "Open/Closed Principle",
      "Interface Segregation Principle"),
    Q("oop", "Hard",
      """What is printed?
```python
class A:
    def hello(self): return "A"

class B(A):
    def hello(self): return "B"

class C(A):
    def hello(self): return "C"

class D(B, C):
    pass

print(D().hello())
```""",
      "B", "A", "C", "An error is raised"),

    # ---------------- Operating Systems ----------------
    Q("operating-systems", "Easy",
      "What is a process?",
      "A program in execution", "A file stored on disk", "A hardware device", "A type of memory"),
    Q("operating-systems", "Easy",
      "Which part of the operating system decides which process runs on the CPU next?",
      "The scheduler", "The file system", "The compiler", "A device driver"),
    Q("operating-systems", "Medium",
      "Which of these is NOT one of the four necessary conditions for a deadlock?",
      "Resources can be preempted", "Mutual exclusion", "Hold and wait", "Circular wait"),
    Q("operating-systems", "Medium",
      "Three processes arrive at time 0 with burst times of 6 ms, 2 ms and 4 ms. Using non-preemptive "
      "Shortest Job First scheduling, what is the average waiting time?",
      "About 2.67 ms", "4 ms", "3.33 ms", "6 ms"),
    Q("operating-systems", "Hard",
      "A system uses 32-bit virtual addresses and 4 KB pages. How many entries does a single-level "
      "page table need?",
      "2^20 (1,048,576)", "2^12 (4,096)", "2^22 (4,194,304)", "2^32 (4,294,967,296)"),
    Q("operating-systems", "Hard",
      "With 3 page frames and FIFO replacement, how many page faults occur for the reference string "
      "1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5?",
      "9", "8", "10", "12"),

    # ---------------- Computer Networks ----------------
    Q("computer-networks", "Easy",
      "What does DNS do?",
      "Translates domain names into IP addresses", "Assigns IP addresses automatically",
      "Encrypts web traffic", "Routes packets between networks"),
    Q("computer-networks", "Easy",
      "Which protocol is used to load web pages securely?",
      "HTTPS", "HTTP", "FTP", "SMTP"),
    Q("computer-networks", "Medium",
      "Which transport-layer protocol guarantees reliable, ordered delivery?",
      "TCP", "UDP", "IP", "ICMP"),
    Q("computer-networks", "Medium",
      "How many usable host addresses are there in a /26 IPv4 subnet?",
      "62", "64", "30", "126"),
    Q("computer-networks", "Hard",
      "A host has IP address 192.168.10.77 with subnet mask 255.255.255.224. What is its network address?",
      "192.168.10.64", "192.168.10.72", "192.168.10.32", "192.168.10.96"),
    Q("computer-networks", "Hard",
      "During TCP connection setup, a client sends SYN with sequence number 1000. The server replies "
      "with SYN-ACK using sequence number 5000. What acknowledgement number does the client send in the "
      "final ACK?",
      "5001", "1001", "5000", "6000"),

    # ---------------- Python ----------------
    Q("python", "Easy",
      "Which keyword is used to define a function in Python?",
      "def", "func", "function", "lambda"),
    Q("python", "Easy",
      "Which of these Python data types is immutable?",
      "tuple", "list", "dict", "set"),
    Q("python", "Medium",
      """What is the output?
```python
nums = [1, 2, 3, 4]
print(nums[-2:])
```""",
      "[3, 4]", "[2, 3]", "[4]", "[1, 2]"),
    Q("python", "Medium",
      """What is the output?
```python
x = {"a": 1}
y = x
y["b"] = 2
print(x)
```""",
      "{'a': 1, 'b': 2}", "{'a': 1}", "{'b': 2}", "An error is raised"),
    Q("python", "Hard",
      """What is printed?
```python
def add(item, bucket=[]):
    bucket.append(item)
    return bucket

add(1)
print(add(2))
```""",
      "[1, 2]", "[2]", "[1]", "An error is raised"),
    Q("python", "Hard",
      """What is printed?
```python
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])
```""",
      "[2, 2, 2]", "[0, 1, 2]", "[0, 0, 0]", "An error is raised"),

    # ---------------- JavaScript ----------------
    Q("javascript", "Easy",
      "Which keyword declares a block-scoped variable that cannot be reassigned?",
      "const", "var", "let", "static"),
    Q("javascript", "Easy",
      "What does typeof [] return in JavaScript?",
      "\"object\"", "\"array\"", "\"list\"", "\"undefined\""),
    Q("javascript", "Medium",
      """What is logged?
```javascript
console.log(1 + '2' + 3);
```""",
      "\"123\"", "6", "\"15\"", "\"33\""),
    Q("javascript", "Medium",
      """What is logged?
```javascript
const arr = [1, 2, 3];
const result = arr.map(n => n * 2).filter(n => n > 2);
console.log(result);
```""",
      "[4, 6]", "[2, 4, 6]", "[6]", "[1, 2, 3]"),
    Q("javascript", "Hard",
      """In what order are the letters logged?
```javascript
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```""",
      "A D C B", "A B C D", "A D B C", "A C D B"),
    Q("javascript", "Hard",
      """What is logged?
```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```""",
      "3 3 3", "0 1 2", "0 0 0", "undefined undefined undefined"),

    # ---------------- TypeScript ----------------
    Q("typescript", "Easy",
      "What is TypeScript?",
      "A typed superset of JavaScript that compiles to JavaScript", "A database for JavaScript apps",
      "A CSS framework", "A JavaScript runtime like Node.js"),
    Q("typescript", "Easy",
      "Which type should you use for a value whose type is not known and must be checked before it is used?",
      "unknown", "any", "never", "void"),
    Q("typescript", "Medium",
      """What is the inferred type of result?
```typescript
function wrap<T>(value: T): T[] {
  return [value];
}
const result = wrap("hi");
```""",
      "string[]", "string", "T[]", "any[]"),
    Q("typescript", "Medium",
      """Given this type, which assignment compiles?
```typescript
type Status = 'active' | 'inactive';
let s: Status;
```""",
      "s = 'inactive';", "s = 'Active';", "s = 1;", "s = 'pending';"),
    Q("typescript", "Hard",
      """What does T evaluate to?
```typescript
type User = { id: number; name: string; email?: string };
type T = Required<Pick<User, 'name' | 'email'>>;
```""",
      "{ name: string; email: string }",
      "{ name: string; email?: string }",
      "{ id: number; name: string; email: string }",
      "{ name?: string; email?: string }"),
    Q("typescript", "Hard",
      """Why does this code fail to compile?
```typescript
function len(x: string | number) {
  return x.length;
}
```""",
      "length does not exist on number, so it can't be used on string | number without narrowing",
      "Union types cannot be used as parameters",
      "Functions must declare a return type",
      "x must be declared with let"),

    # ---------------- Java ----------------
    Q("java", "Easy",
      "Which method signature is the entry point of a Java application?",
      "public static void main(String[] args)", "public void start()", "static int main()",
      "public static void run(String args)"),
    Q("java", "Easy",
      "Which keyword is used by a class to inherit from another class in Java?",
      "extends", "implements", "inherits", "super"),
    Q("java", "Medium",
      """What is printed?
```java
String a = "hello";
String b = new String("hello");
System.out.println(a == b);
System.out.println(a.equals(b));
```""",
      "false, then true", "true, then true", "true, then false", "false, then false"),
    Q("java", "Medium",
      """What is printed?
```java
int x = 5;
int y = x++ + ++x;
System.out.println(y);
```""",
      "12", "10", "11", "13"),
    Q("java", "Hard",
      """What happens when this code runs?
```java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
for (Integer n : list) {
    if (n == 1) list.remove(n);
}
```""",
      "A ConcurrentModificationException is thrown", "list becomes [2, 3]", "list becomes [1, 3]",
      "It does not compile"),
    Q("java", "Hard",
      "Which statement about java.util.HashMap is correct?",
      "It allows one null key and multiple null values", "It is synchronized and thread-safe",
      "It keeps keys in insertion order", "Lookups always take O(log n) time"),

    # ---------------- HTML ----------------
    Q("html", "Easy",
      "Which HTML element represents the most important (top-level) heading?",
      "<h1>", "<head>", "<h6>", "<header>"),
    Q("html", "Easy",
      "What does the alt attribute on an <img> element provide?",
      "Alternative text for screen readers and when the image can't load", "The image size",
      "The image alignment", "The image file format"),
    Q("html", "Medium",
      "Which input type shows a date picker in modern browsers?",
      "<input type=\"date\">", "<input type=\"text\">", "<input type=\"calendar\">", "<input type=\"day\">"),
    Q("html", "Medium",
      "Which element is the most semantic choice for a self-contained piece of content that could be "
      "shared on its own, such as a blog post?",
      "<article>", "<div>", "<section>", "<span>"),
    Q("html", "Hard",
      "A form contains <button>Save</button> with no type attribute. What happens when it is clicked?",
      "It submits the form, because a button's default type is submit",
      "Nothing, because buttons need an onclick handler",
      "It resets the form",
      "It reloads the page without submitting"),
    Q("html", "Hard",
      "Which statement about <script src=\"app.js\" defer> is correct?",
      "It downloads in parallel and runs after the HTML is parsed, in document order",
      "It runs as soon as it downloads, possibly before parsing finishes",
      "It blocks HTML parsing until it has run",
      "It only works for inline scripts"),

    # ---------------- CSS ----------------
    Q("css", "Easy",
      "Which CSS property changes the colour of text?",
      "color", "font-color", "text-color", "foreground"),
    Q("css", "Easy",
      "Which CSS property sets the space between an element's border and its content?",
      "padding", "margin", "spacing", "border-gap"),
    Q("css", "Medium",
      ".box { width: 200px; padding: 20px; border: 5px solid; box-sizing: content-box; }\n"
      "What is the total rendered width of .box?",
      "250px", "200px", "240px", "210px"),
    Q("css", "Medium",
      "Which selector has the highest specificity?",
      "#main p", "div p", ".card p", "p"),
    Q("css", "Hard",
      "An element with z-index: 9999 still appears behind a sibling of its parent that has z-index: 1. "
      "What is the most likely cause?",
      "Its parent creates a stacking context with a lower z-index than that sibling",
      "z-index only works on elements with display: block",
      "z-index values above 999 are ignored",
      "The sibling has position: static"),
    Q("css", "Hard",
      "What does grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); do?",
      "Creates as many columns of at least 200px as fit, stretching them to fill the row",
      "Creates exactly 200 columns",
      "Creates one 200px column and one flexible column",
      "Creates columns only when content overflows"),

    # ---------------- React ----------------
    Q("react", "Easy",
      "What is JSX?",
      "A syntax extension that lets you write HTML-like markup in JavaScript", "A database query language",
      "A CSS preprocessor", "A testing library"),
    Q("react", "Easy",
      "How does a parent component pass data to a child component?",
      "Through props", "Through refs only", "Through global CSS", "Through the URL only"),
    Q("react", "Medium",
      "Why does React warn when a list is rendered without a key prop on each item?",
      "Keys help React identify which items changed, were added or removed between renders",
      "Keys are needed for CSS styling",
      "Without keys the list will not render at all",
      "Keys keep the list sorted"),
    Q("react", "Medium",
      """What does this component render?
```jsx
function App() {
  const items = [];
  return <div>{items.length && <p>Has items</p>}</div>;
}
```""",
      "A div containing the text 0", "An empty div", "A div containing \"Has items\"", "An error"),
    Q("react", "Hard",
      "A child component wrapped in React.memo receives onSelect={() => handle(id)} from a parent that "
      "re-renders often. Why does the child still re-render every time?",
      "A new function is created on every parent render, so the prop changes by reference",
      "React.memo only works with class components",
      "Children always re-render with their parent, even with React.memo",
      "React.memo ignores function props"),
    Q("react", "Hard",
      "In React 18, what does <StrictMode> do in development?",
      "Intentionally double-invokes rendering and re-runs effects to expose side-effect bugs",
      "Disables all warnings",
      "Prevents state updates",
      "Makes the production build faster"),

    # ---------------- React Hooks ----------------
    Q("react-hooks", "Easy",
      "Which hook adds local state to a function component?",
      "useState", "useEffect", "useRef", "useMemo"),
    Q("react-hooks", "Easy",
      "When does a useEffect with an empty dependency array ([]) run its effect?",
      "Once, after the component first mounts", "After every render", "Never", "Only when the component unmounts"),
    Q("react-hooks", "Medium",
      """What does the button show after it is clicked once?
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => { setCount(count + 1); setCount(count + 1); }}>
      {count}
    </button>
  );
}
```""",
      "1", "0", "2", "An error"),
    Q("react-hooks", "Medium",
      "What is the main difference between useRef and useState?",
      "Changing ref.current does not trigger a re-render, while updating state does",
      "useRef can only store DOM nodes",
      "Refs reset on every render but state does not",
      "useRef only works in class components"),
    Q("react-hooks", "Hard",
      """What does this component show after 5 seconds?
```jsx
function Timer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <p>{count}</p>;
}
```""",
      "1, because the interval keeps using the count from the first render",
      "5", "0", "A number that keeps increasing every second"),
    Q("react-hooks", "Hard",
      "A component uses const sorted = useMemo(() => sortItems(items), [items]); but the parent builds "
      "items with data.filter(d => d.active) on every render. How do you make the memo effective?",
      "Memoise items too (or compute it inside the useMemo from data), because a new array each render "
      "invalidates the memo",
      "Remove the dependency array",
      "Replace useMemo with useEffect",
      "Add sortItems to the dependency array"),

    # ---------------- Node.js & Express ----------------
    Q("nodejs-express", "Easy",
      "What is Node.js?",
      "A JavaScript runtime built on the V8 engine for running JavaScript outside the browser",
      "A web browser", "A CSS framework", "A database"),
    Q("nodejs-express", "Easy",
      "Which command creates a new package.json file?",
      "npm init", "npm start", "npm build", "node init"),
    Q("nodejs-express", "Medium",
      "In Express, what does calling next() inside a middleware do?",
      "Passes control to the next middleware or route handler", "Ends the response",
      "Restarts the server", "Sends a 404 response"),
    Q("nodejs-express", "Medium",
      """In what order are the messages logged?
```javascript
const fs = require('fs');
console.log('start');
fs.readFile(__filename, () => console.log('file read'));
console.log('end');
```""",
      "start, end, file read", "start, file read, end", "file read, start, end", "end, start, file read"),
    Q("nodejs-express", "Hard",
      "How does Express recognise a middleware function as an error handler?",
      "It takes four parameters: (err, req, res, next)", "It is registered before all routes",
      "It is named errorHandler", "It is registered with app.error()"),
    Q("nodejs-express", "Hard",
      "In Express 4, an async route handler awaits db.query(), which rejects, and there is no try/catch. "
      "What happens?",
      "The rejection is unhandled and the request hangs unless the error is passed to next()",
      "Express automatically sends a 500 response",
      "The server restarts",
      "Express logs the error and sends a 404"),

    # ---------------- REST APIs ----------------
    Q("rest-apis", "Easy",
      "Which HTTP method is normally used to retrieve data?",
      "GET", "POST", "PUT", "DELETE"),
    Q("rest-apis", "Easy",
      "What does HTTP status code 404 mean?",
      "Not Found", "Internal Server Error", "Unauthorized", "Created"),
    Q("rest-apis", "Medium",
      "Which status code best fits a successful POST request that created a new resource?",
      "201 Created", "200 OK", "204 No Content", "302 Found"),
    Q("rest-apis", "Medium",
      "Which HTTP methods are idempotent by definition?",
      "GET, PUT and DELETE", "POST and PATCH", "Only GET", "POST and PUT"),
    Q("rest-apis", "Hard",
      "A client receives 401 for one request and 403 for another. What is the difference?",
      "401 means not authenticated (missing or invalid credentials); 403 means authenticated but not allowed",
      "401 means the server is down; 403 means the resource does not exist",
      "They mean exactly the same thing",
      "403 means credentials are missing; 401 means access is denied"),
    Q("rest-apis", "Hard",
      "An endpoint returns a large list where new rows are inserted often. Which pagination approach avoids "
      "skipped or duplicated items between pages?",
      "Cursor-based (keyset) pagination using the last seen ID", "Offset/limit pagination",
      "Returning all items in one response", "Random sampling of items"),

    # ---------------- Databases ----------------
    Q("databases", "Easy",
      "What is a primary key?",
      "A column or set of columns that uniquely identifies each row", "A column that may contain duplicates",
      "The password used to connect to the database", "An index created on every column"),
    Q("databases", "Easy",
      "Which of these is a NoSQL document database?",
      "MongoDB", "PostgreSQL", "MySQL", "SQLite"),
    Q("databases", "Medium",
      "What does the 'I' (Isolation) in ACID guarantee?",
      "Concurrent transactions do not see each other's uncommitted intermediate changes",
      "Data is stored on separate disks",
      "Every query uses an index",
      "The database is isolated from the network"),
    Q("databases", "Medium",
      "A student can enrol in many courses and each course has many students. How is this usually modelled "
      "in a relational database?",
      "A junction table (e.g. enrollments) with student_id and course_id",
      "A course_id column on the students table",
      "Course names stored as comma-separated text",
      "One duplicated student row per course"),
    Q("databases", "Hard",
      "Queries frequently filter with WHERE last_name = 'Shah' AND city = 'Pune'. Which index helps most?",
      "A composite index on (last_name, city)", "Separate indexes on every column of the table",
      "Only the primary key index", "No index, because full table scans are always faster"),
    Q("databases", "Hard",
      "In PostgreSQL at READ COMMITTED isolation, two transactions try to UPDATE the same row at the same "
      "time. What happens to the second UPDATE?",
      "It waits for the first transaction to finish, then re-checks the row and applies its update",
      "Both updates are silently lost",
      "It fails immediately with a syntax error",
      "It overwrites the first update before the first transaction commits"),

    # ---------------- SQL ----------------
    Q("sql", "Easy",
      "Which SQL statement retrieves data from a table?",
      "SELECT", "GET", "FETCH", "PULL"),
    Q("sql", "Easy",
      "Which clause filters individual rows in a SELECT query?",
      "WHERE", "ORDER BY", "GROUP BY", "LIMIT"),
    Q("sql", "Medium",
      """What does this query return?
```sql
SELECT department, COUNT(*)
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;
```""",
      "Each department with more than 5 employees, along with its employee count",
      "Every employee who works in a department with more than 5 people",
      "The 5 largest departments",
      "Departments with exactly 5 employees"),
    Q("sql", "Medium",
      "Table A has 4 rows and table B has 3 rows. How many rows does SELECT * FROM A CROSS JOIN B return?",
      "12", "7", "4", "3"),
    Q("sql", "Hard",
      "Which query returns the second-highest distinct salary from employees?",
      "SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);",
      "SELECT MAX(salary) FROM employees;",
      "SELECT salary FROM employees ORDER BY salary LIMIT 2;",
      "SELECT MIN(salary) FROM employees LIMIT 2;"),
    Q("sql", "Hard",
      "Table orders has 10 rows: 3 have coupon = NULL, 4 have coupon = 'SAVE10' and 3 have coupon = "
      "'FREESHIP'. How many rows does SELECT * FROM orders WHERE coupon <> 'SAVE10'; return?",
      "3", "6", "7", "10"),

    # ---------------- MongoDB ----------------
    Q("mongodb", "Easy",
      "In MongoDB, what is a collection?",
      "A group of documents, similar to a table", "A single field in a document", "A database server",
      "An index"),
    Q("mongodb", "Easy",
      "In which format does MongoDB store documents internally?",
      "BSON", "XML", "CSV", "YAML"),
    Q("mongodb", "Medium",
      "Which query finds users older than 25?",
      "db.users.find({ age: { $gt: 25 } })", "db.users.find({ age > 25 })",
      "db.users.find({ $gt: { age: 25 } })", "db.users.select({ age: 25 })"),
    Q("mongodb", "Medium",
      """What does this update do?
```javascript
db.users.updateOne({ _id: 1 }, { $push: { tags: 'admin' } })
```""",
      "Appends 'admin' to the tags array of the user with _id 1",
      "Replaces the whole document with { tags: 'admin' }",
      "Removes 'admin' from the tags array",
      "Creates a new collection named tags"),
    Q("mongodb", "Hard",
      """What does this aggregation return?
```javascript
db.orders.aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: '$customerId', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
  { $limit: 3 }
])
```""",
      "The top 3 customers by total paid amount, with their totals",
      "The 3 most recent paid orders",
      "The total amount of all orders",
      "3 random customers"),
    Q("mongodb", "Hard",
      "When is embedding related data inside a document preferred over referencing another collection?",
      "When the related data is small, bounded and usually read together with the parent",
      "When the related data grows without limit, such as every log entry for a user",
      "Never, because MongoDB requires references",
      "When the related data is shared by many documents and updated often"),

    # ---------------- Machine Learning ----------------
    Q("machine-learning", "Easy",
      "What is supervised learning?",
      "Learning from labelled examples to predict outputs", "Learning without any data",
      "Grouping unlabelled data only", "Writing rules by hand"),
    Q("machine-learning", "Easy",
      "Which of these is a classification task?",
      "Predicting whether an email is spam", "Predicting a house price", "Predicting tomorrow's temperature",
      "Predicting a stock's closing price"),
    Q("machine-learning", "Medium",
      "A model scores 99% accuracy on training data but 70% on test data. What is the most likely problem?",
      "Overfitting", "Underfitting", "The learning rate is too low", "The test set is too large"),
    Q("machine-learning", "Medium",
      "A disease affects 1% of patients. A model always predicts 'healthy'. What is its accuracy, and why is "
      "accuracy misleading here?",
      "99%, but it detects none of the sick patients (recall is 0)",
      "1%, because it never predicts the disease",
      "50%, because there are two classes",
      "100%, because it is never wrong"),
    Q("machine-learning", "Hard",
      "A classifier has precision 0.8 and recall 0.5. What is its F1 score?",
      "About 0.62", "0.65", "0.40", "0.50"),
    Q("machine-learning", "Hard",
      "Why should a feature scaler be fitted on the training set only and then applied to the test set?",
      "Fitting it on all data leaks information about the test set into training and inflates evaluation results",
      "Scaling the test set is not allowed",
      "It makes training faster",
      "The test set has no features to scale"),

    # ---------------- Deep Learning ----------------
    Q("deep-learning", "Easy",
      "What is the purpose of an activation function in a neural network?",
      "To introduce non-linearity so the network can learn complex patterns", "To initialise the weights",
      "To store training data", "To lower the learning rate"),
    Q("deep-learning", "Easy",
      "What does one epoch mean in neural network training?",
      "One full pass over the entire training dataset", "One pass over a single batch",
      "One layer of the network", "One weight update"),
    Q("deep-learning", "Medium",
      "Why is ReLU often preferred over sigmoid in hidden layers?",
      "It reduces the vanishing gradient problem and is cheap to compute",
      "It outputs probabilities between 0 and 1",
      "It is differentiable everywhere, including at 0",
      "It always prevents overfitting"),
    Q("deep-learning", "Medium",
      "A 32x32 RGB image goes through a convolution layer with 16 filters of size 3x3, stride 1 and no "
      "padding. What is the output shape?",
      "30 x 30 x 16", "32 x 32 x 16", "30 x 30 x 3", "16 x 16 x 16"),
    Q("deep-learning", "Hard",
      "Training loss keeps falling, but validation loss starts rising after epoch 10. Which technique "
      "directly addresses this?",
      "Early stopping or stronger regularisation such as dropout", "Increasing the learning rate",
      "Removing the validation set", "Adding more layers"),
    Q("deep-learning", "Hard",
      "In scaled dot-product attention, why are the scores divided by the square root of d_k?",
      "To stop dot products growing with dimension, which would push softmax into regions with tiny gradients",
      "To turn the scores into probabilities",
      "To reduce memory usage",
      "To make attention symmetric"),

    # ---------------- Git ----------------
    Q("git", "Easy",
      "Which command copies a remote repository to your machine?",
      "git clone", "git init", "git pull", "git fork"),
    Q("git", "Easy",
      "Which command shows which files are modified, staged or untracked?",
      "git status", "git log", "git show", "git tag"),
    Q("git", "Medium",
      "What is the difference between git fetch and git pull?",
      "fetch downloads remote changes without merging; pull fetches and then merges (or rebases) them",
      "There is no difference",
      "pull only works on the main branch",
      "fetch deletes local changes"),
    Q("git", "Medium",
      "You made a typo in the last commit message and have not pushed yet. Which command fixes the message?",
      "git commit --amend", "git revert HEAD", "git reset --hard", "git rebase main"),
    Q("git", "Hard",
      "A bad commit has already been pushed to a shared branch. What is the safest way to undo its changes?",
      "git revert <commit>, which adds a new commit that undoes it",
      "git reset --hard HEAD~1 followed by a force push",
      "Delete the branch and recreate it",
      "git checkout <commit>"),
    Q("git", "Hard",
      "After running git rebase main on a feature branch that was already pushed, git push is rejected. Why?",
      "Rebasing rewrote the branch's commits, so a force push (preferably --force-with-lease) is needed",
      "The remote server is down",
      "Rebasing deletes the remote branch",
      "You must run git merge before every push"),
]
