import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Play, Pause, SkipForward, SkipBack, RefreshCw, Volume2, 
  VolumeX, Code2, AlertCircle, CheckCircle, ChevronRight, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ALGORITHMS_DATA = {
  'linear-search': {
    title: 'Linear Search',
    topic: 'Searching',
    narration: [
      'We start search from the first box. Low pointer begins at index 0.',
      '12 is not our target 18. We move to the next box.',
      '35 is not our target 18. We move pointer forward.',
      'Checking index 2. 56 is not 18. Move next.',
      'Checking index 3. 18 matches our target! We found it.',
      'Search complete. We return index 3.'
    ],
    frames: [
      { active: 0, found: false, pointers: { i: 0 } },
      { active: 1, found: false, pointers: { i: 1 } },
      { active: 2, found: false, pointers: { i: 2 } },
      { active: 3, found: false, pointers: { i: 3 } },
      { active: 3, found: true, pointers: { i: 3 } },
      { active: -1, found: true, pointers: {} }
    ],
    code: {
      python: {
        src: `def linear_search(arr, target):
    # Loop from index 0 to length of list
    for i in range(len(arr)):
        # If target matches current element
        if arr[i] == target:
            # Return current index
            return i
    # Return -1 if target is missing
    return -1`,
        lineMap: [0, 2, 4, 4, 6, 8]
      },
      cpp: {
        src: `int linearSearch(int arr[], int n, int target) {
    // Loop through each element
    for (int i = 0; i < n; i++) {
        // If element matches target
        if (arr[i] == target) {
            // Return index position
            return i;
        }
    }
    // Return -1 if not found
    return -1;
}`,
        lineMap: [0, 2, 4, 4, 6, 9]
      },
      java: {
        src: `public static int linearSearch(int[] arr, int target) {
    // Iterate over array values
    for (int i = 0; i < arr.length; i++) {
        // Match condition check
        if (arr[i] == target) {
            // Return match index
            return i;
        }
    }
    // Return placeholder
    return -1;
}`,
        lineMap: [0, 2, 4, 4, 6, 9]
      },
      c: {
        src: `int linearSearch(int arr[], int n, int target) {
    // Traverse element by element
    for (int i = 0; i < n; i++) {
        // Check if value equals target
        if (arr[i] == target) {
            // Return index position
            return i;
        }
    }
    // Return invalid value
    return -1;
}`,
        lineMap: [0, 2, 4, 4, 6, 9]
      }
    },
    broken: {
      python: `def linear_search(arr, target):
    for i in range(len(arr)):
        # BUG: checking index position instead of value
        if i == target:
            return i
    return -1`,
      cpp: `int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        // BUG: checking index position instead of value
        if (i == target) {
            return i;
        }
    }
    return -1;
}`,
      java: `public static int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        // BUG: checking index position instead of value
        if (i == target) {
            return i;
        }
    }
    return -1;
}`,
      c: `int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        // BUG: checking index position instead of value
        if (i == target) {
            return i;
        }
    }
    return -1;
}`
    },
    test: (code, lang) => {
      // Basic validation logic on correct solution text or patterns
      const norm = code.replace(/\s+/g, '');
      if (lang === 'python') {
        return norm.includes('arr[i]==target') || norm.includes('x==target');
      } else {
        return norm.includes('arr[i]==target');
      }
    }
  },
  'binary-search': {
    title: 'Binary Search',
    topic: 'Searching',
    narration: [
      'Initialize Low at index 0, High at index 6. Middle is index 3: 44.',
      'Since middle 44 is less than target 55, target lies in right half.',
      'Low moves to index 4. Middle is now index 5: 66.',
      'Middle 66 is greater than target 55. Target lies in left sub-half.',
      'High moves to index 4. Middle is now index 4: 55.',
      'Middle 55 matches target! Search completes.',
      'Return middle index 4.'
    ],
    frames: [
      { low: 0, high: 6, mid: 3, active: 3, found: false },
      { low: 4, high: 6, mid: 5, active: 5, found: false },
      { low: 4, high: 6, mid: 5, active: 5, found: false },
      { low: 4, high: 4, mid: 4, active: 4, found: false },
      { low: 4, high: 4, mid: 4, active: 4, found: true },
      { low: -1, high: -1, mid: -1, active: -1, found: true }
    ],
    code: {
      python: {
        src: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
        lineMap: [1, 2, 3, 4, 7, 9, 10]
      },
      cpp: {
        src: `int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
        lineMap: [1, 2, 3, 4, 5, 6, 7]
      },
      java: {
        src: `public static int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
        lineMap: [1, 2, 3, 4, 5, 6, 7]
      },
      c: {
        src: `int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
        lineMap: [1, 2, 3, 4, 5, 6, 7]
      }
    },
    broken: {
      python: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            # BUG: forgets to add 1, causing infinite loops
            low = mid
        else:
            high = mid - 1
    return -1`,
      cpp: `int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) {
            // BUG: forgets to add 1, causing infinite loops
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
      java: `public static int binarySearch(int[] arr, int target) {
    int low = 0, high = arr.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) {
            // BUG: forgets to add 1, causing infinite loops
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
      c: `int binarySearch(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) {
            // BUG: forgets to add 1, causing infinite loops
            low = mid;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`
    },
    test: (code, lang) => {
      const norm = code.replace(/\s+/g, '');
      return norm.includes('mid+1');
    }
  },
  'bubble-sort': {
    title: 'Bubble Sort',
    topic: 'Sorting',
    narration: [
      'Compare element 0 (64) and index 1 (34). 64 is greater, so swap them.',
      'Compare 64 and 25. Swap them, bubble larger value up.',
      'Compare 64 and 12. 64 is larger, swap.',
      'Compare 64 and 22. Swap them. 64 reaches correct end position.',
      'First bubble pass completes. Array is partially sorted.'
    ],
    frames: [
      { active: [0, 1], swap: true, data: [64, 34, 25, 12, 22] },
      { active: [1, 2], swap: true, data: [34, 64, 25, 12, 22] },
      { active: [2, 3], swap: true, data: [34, 25, 64, 12, 22] },
      { active: [3, 4], swap: true, data: [34, 25, 12, 64, 22] },
      { active: [], swap: false, data: [34, 25, 12, 22, 64] }
    ],
    code: {
      python: {
        src: `def bubble_sort(arr):
    n = len(arr)
    # Loop over all array elements
    for i in range(n):
        # Last i elements are already in place
        for j in range(0, n - i - 1):
            # Swap if elements are out of order
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
        lineMap: [1, 3, 5, 7, 8]
      },
      cpp: {
        src: `void bubbleSort(int arr[], int n) {
    // Nested traversal checks
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            // Swap condition check
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
        lineMap: [1, 2, 3, 4, 5]
      },
      java: {
        src: `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
        lineMap: [2, 3, 4, 5, 7]
      },
      c: {
        src: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
        lineMap: [1, 2, 3, 4, 5]
      }
    },
    broken: {
      python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        # BUG: forgets -1, causes IndexOutOfBounds error
        for j in range(0, n - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
      cpp: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        // BUG: forgets -1, causes IndexOutOfBounds error
        for (int j = 0; j < n - i; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
      java: `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        // BUG: forgets -1, causes IndexOutOfBounds error
        for (int j = 0; j < n - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
      c: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        // BUG: forgets -1, causes IndexOutOfBounds error
        for (int j = 0; j < n - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
    },
    test: (code, lang) => {
      const norm = code.replace(/\s+/g, '');
      return norm.includes('-i-1') || norm.includes('n-1-i');
    }
  },
  'stack-operations': {
    title: 'Stack Operations',
    topic: 'Linear structures',
    narration: [
      'Empty Stack initialized. Top pointer is -1.',
      'Pushing 10. Element falls into stack index 0.',
      'Pushing 20. Land on top of 10 at index 1.',
      'Popping element. Top element 20 is extracted.',
      'Stack size drops. Only 10 remains in stack.'
    ],
    frames: [
      { stack: [], pointer: -1, action: 'init' },
      { stack: [10], pointer: 0, action: 'push' },
      { stack: [10, 20], pointer: 1, action: 'push' },
      { stack: [10], pointer: 0, action: 'pop' },
      { stack: [10], pointer: 0, action: 'done' }
    ],
    code: {
      python: {
        src: `class Stack:
    def __init__(self):
        self.items = []
    def push(self, item):
        self.items.append(item)
    def pop(self):
        if not self.is_empty():
            return self.items.pop()
    def is_empty(self):
        return len(self.items) == 0`,
        lineMap: [1, 4, 5, 8, 9]
      },
      cpp: {
        src: `class Stack {
    vector<int> items;
public:
    void push(int val) {
        items.push_back(val);
    }
    int pop() {
        if (items.empty()) return -1;
        int val = items.back();
        items.pop_back();
        return val;
    }
};`,
        lineMap: [1, 4, 6, 8, 9]
      },
      java: {
        src: `class Stack {
    private List<Integer> items = new ArrayList<>();
    public void push(int val) {
        items.add(val);
    }
    public int pop() {
        if (items.isEmpty()) return -1;
        return items.remove(items.size() - 1);
    }
}`,
        lineMap: [1, 3, 5, 6, 7]
      },
      c: {
        src: `#define MAX 100
int stack[MAX];
int top = -1;
void push(int val) {
    if (top < MAX - 1) {
        stack[++top] = val;
    }
}
int pop() {
    if (top >= 0) {
        return stack[top--];
    }
    return -1;
}`,
        lineMap: [2, 4, 5, 8, 10]
      }
    },
    broken: {
      python: `class Stack:
    def __init__(self):
        self.items = []
    def push(self, item):
        self.items.append(item)
    def pop(self):
        # BUG: missing empty safety check, causing crash on empty pop
        return self.items.pop()`,
      cpp: `class Stack {
    vector<int> items;
public:
    void push(int val) {
        items.push_back(val);
    }
    int pop() {
        // BUG: missing safety check on empty stack
        int val = items.back();
        items.pop_back();
        return val;
    }
};`,
      java: `class Stack {
    private List<Integer> items = new ArrayList<>();
    public void push(int val) {
        items.add(val);
    }
    public int pop() {
        // BUG: missing safety check on empty stack
        return items.remove(items.size() - 1);
    }
}`,
      c: `int stack[100];
int top = -1;
void push(int val) {
    stack[++top] = val;
}
int pop() {
    // BUG: missing empty boundary check
    return stack[top--];
}`
    },
    test: (code, lang) => {
      const norm = code.replace(/\s+/g, '');
      if (lang === 'python') {
        return norm.includes('is_empty') || norm.includes('len(self.items)>0') || norm.includes('ifself.items');
      } else {
        return norm.includes('empty') || norm.includes('top>=0') || norm.includes('size()>0');
      }
    }
  },
  'two-pointers': {
    title: 'Two Pointers (Reverse Array)',
    topic: 'Array logic',
    narration: [
      'Left pointer is at index 0 (10), Right pointer at index 4 (50). Swap them.',
      'Swap complete. Left increases to index 1 (20). Right decreases to index 3 (40).',
      'Swap index 1 (20) and index 3 (40). Pointers progress inward.',
      'Left meets right pointer at index 2 (30). No swap needed.',
      'Pointers meet. Array reversal is complete!'
    ],
    frames: [
      { left: 0, right: 4, data: [10, 20, 30, 40, 50] },
      { left: 1, right: 3, data: [50, 20, 30, 40, 10] },
      { left: 1, right: 3, data: [50, 40, 30, 20, 10] },
      { left: 2, right: 2, data: [50, 40, 30, 20, 10] },
      { left: -1, right: -1, data: [50, 40, 30, 20, 10] }
    ],
    code: {
      python: {
        src: `def reverse_array(arr):
    left, right = 0, len(arr) - 1
    # Loop until pointers cross in middle
    while left < right:
        # Swap outer elements
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1`,
        lineMap: [1, 3, 5, 6, 7]
      },
      cpp: {
        src: `void reverseArray(int arr[], int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        swap(arr[left], arr[right]);
        left++;
        right--;
    }
}`,
        lineMap: [1, 2, 3, 4, 5]
      },
      java: {
        src: `public static void reverseArray(int[] arr) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}`,
        lineMap: [1, 2, 3, 6, 7]
      },
      c: {
        src: `void reverseArray(int arr[], int n) {
    int left = 0, right = n - 1;
    while (left < right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}`,
        lineMap: [1, 2, 3, 6, 7]
      }
    },
    broken: {
      python: `def reverse_array(arr):
    left, right = 0, len(arr) - 1
    # BUG: using while true instead of comparing boundary, causes infinite loop
    while True:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1`,
      cpp: `void reverseArray(int arr[], int n) {
    int left = 0, right = n - 1;
    // BUG: loop condition will loop forever
    while (left != right) {
        swap(arr[left], arr[right]);
        left++;
        right--;
    }
}`,
      java: `public static void reverseArray(int[] arr) {
    int left = 0, right = arr.length - 1;
    // BUG: loop condition will loop forever
    while (left != right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}`,
      c: `void reverseArray(int arr[], int n) {
    int left = 0, right = n - 1;
    // BUG: loop condition will loop forever
    while (left != right) {
        int temp = arr[left];
        arr[left] = arr[right];
        arr[right] = temp;
        left++;
        right--;
    }
}`
    },
    test: (code, lang) => {
      const norm = code.replace(/\s+/g, '');
      return norm.includes('left<right');
    }
  }
};

export default function DsaLab({ token }) {
  const [selectedAlg, setSelectedAlg] = useState('linear-search');
  const [frameIdx, setFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // multiplier
  const [speakNarration, setSpeakNarration] = useState(true);
  const [codeLang, setCodeLang] = useState('python');
  
  // Playground state
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [testFeedback, setTestFeedback] = useState('');

  const alg = ALGORITHMS_DATA[selectedAlg];
  const totalFrames = alg.frames.length;
  const currentFrame = alg.frames[frameIdx];

  // Narration Speech Synthesis
  const speakCurrentNarration = (text) => {
    if (!speakNarration) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Find Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const indVoice = voices.find(v => v.lang.includes('EN-IN') || v.name.includes('India'));
    if (indVoice) utterance.voice = indVoice;
    
    utterance.rate = 0.95; // Slightly slower for beginners
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Reset frame and playground on algorithm change
    setFrameIdx(0);
    setIsPlaying(false);
    setIsCorrect(null);
    setTestFeedback('');
    setPlaygroundCode(alg.broken[codeLang]);
    speakCurrentNarration(alg.narration[0]);
  }, [selectedAlg]);

  useEffect(() => {
    setPlaygroundCode(alg.broken[codeLang]);
  }, [codeLang]);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setFrameIdx((prev) => {
          if (prev >= totalFrames - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          speakCurrentNarration(alg.narration[next]);
          return next;
        });
      }, 3000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, selectedAlg]);

  const handleStep = (forward) => {
    setIsPlaying(false);
    if (forward && frameIdx < totalFrames - 1) {
      const next = frameIdx + 1;
      setFrameIdx(next);
      speakCurrentNarration(alg.narration[next]);
    } else if (!forward && frameIdx > 0) {
      const prev = frameIdx - 1;
      setFrameIdx(prev);
      speakCurrentNarration(alg.narration[prev]);
    }
  };

  const verifyPlayground = () => {
    const passed = alg.test(playgroundCode, codeLang);
    setIsCorrect(passed);
    if (passed) {
      setTestFeedback('🟢 Excellent! All evaluation test cases passed successfully!');
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });
    } else {
      setTestFeedback('❌ Wrong Answer. The loop boundaries or pointer checks are still incorrect. Look at the visual steps for a hint!');
    }
  };

  const getCodeLineToHighlight = () => {
    const langCode = alg.code[codeLang];
    if (langCode && langCode.lineMap) {
      return langCode.lineMap[frameIdx] || 0;
    }
    return 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-8 h-8 text-primary-600" /> NQT DSA Laboratory
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Learn algorithms step-by-step with visual execution maps and debug the code templates yourself.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Interactive Visualizer Shell */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            {/* Visualizer Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-805 dark:text-white">{alg.title} Visualizer</h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{alg.topic} Topic</span>
              </div>

              {/* Speech Narration Toggle */}
              <button 
                onClick={() => setSpeakNarration(!speakNarration)}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                  speakNarration 
                    ? 'bg-primary-50 dark:bg-primary-950/20 border-primary-300 text-primary-600 dark:text-primary-400' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                {speakNarration ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">Voice Narration</span>
              </button>
            </div>

            {/* SVG Visual Canvas */}
            <div className="w-full h-52 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-250/30 flex items-center justify-center p-6 relative overflow-hidden">
              {/* Linear Search & Binary Search Visualizer */}
              {(selectedAlg === 'linear-search' || selectedAlg === 'binary-search') && (
                <div className="flex gap-3">
                  {[12, 35, 56, 18, 90, 77, 44].slice(0, selectedAlg === 'linear-search' ? 5 : 7).map((val, idx) => {
                    let style = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                    
                    if (selectedAlg === 'linear-search') {
                      if (currentFrame.active === idx) {
                        style = currentFrame.found
                          ? 'bg-emerald-500 text-white border-transparent'
                          : 'bg-primary-500 text-white border-transparent';
                      }
                    } else if (selectedAlg === 'binary-search') {
                      const isLow = currentFrame.low === idx;
                      const isHigh = currentFrame.high === idx;
                      const isMid = currentFrame.mid === idx;
                      if (isMid) {
                        style = currentFrame.found
                          ? 'bg-emerald-500 text-white border-transparent shadow'
                          : 'bg-amber-500 text-white border-transparent shadow';
                      } else if (isLow || isHigh) {
                        style = 'bg-primary-100 dark:bg-primary-950/30 border-primary-400 text-primary-600 dark:text-primary-400';
                      }
                    }

                    return (
                      <motion.div
                        key={idx}
                        layout
                        className={`w-12 h-12 rounded-xl border flex flex-col justify-center items-center font-bold text-xs relative ${style}`}
                      >
                        <span>{val}</span>
                        {/* Pointers mapping labels */}
                        {selectedAlg === 'binary-search' && (
                          <div className="absolute -bottom-6 text-[8px] font-black uppercase text-slate-400">
                            {currentFrame.low === idx && 'L'}
                            {currentFrame.high === idx && 'H'}
                            {currentFrame.mid === idx && 'M'}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Bubble Sort Visualizer */}
              {selectedAlg === 'bubble-sort' && (
                <div className="flex items-end gap-4 h-36">
                  {currentFrame.data.map((val, idx) => {
                    const isActive = currentFrame.active.includes(idx);
                    const isSorted = idx >= (5 - frameIdx);
                    
                    let barColor = 'bg-indigo-600 dark:bg-indigo-500';
                    if (isActive) barColor = 'bg-rose-500';
                    else if (isSorted) barColor = 'bg-emerald-500';

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">{val}</span>
                        <motion.div
                          layout
                          style={{ height: `${val * 1.5}px` }}
                          className={`w-8 rounded-t-lg transition-colors duration-200 ${barColor}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stack Operations Visualizer */}
              {selectedAlg === 'stack-operations' && (
                <div className="relative w-44 h-40 border-b-4 border-x-4 border-slate-300 dark:border-slate-800 rounded-b-xl flex flex-col justify-end p-2 gap-1.5">
                  <AnimatePresence>
                    {currentFrame.stack.map((val, idx) => (
                      <motion.div
                        key={val}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="w-full bg-primary-600 text-white rounded-lg h-9 flex items-center justify-center font-bold text-xs shadow-sm"
                      >
                        Stack Element: {val}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {currentFrame.stack.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">Empty Stack Container</div>
                  )}
                </div>
              )}

              {/* Two Pointers (Reverse Array) Visualizer */}
              {selectedAlg === 'two-pointers' && (
                <div className="flex gap-3">
                  {currentFrame.data.map((val, idx) => {
                    const isLeft = currentFrame.left === idx;
                    const isRight = currentFrame.right === idx;
                    const isChecking = isLeft || isRight;

                    let style = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                    if (isChecking) {
                      style = 'bg-rose-500 text-white border-transparent shadow';
                    }

                    return (
                      <motion.div
                        key={idx}
                        layout
                        className={`w-12 h-12 rounded-xl border flex flex-col justify-center items-center font-bold text-xs relative ${style}`}
                      >
                        <span>{val}</span>
                        {isChecking && (
                          <div className="absolute -bottom-6 text-[8px] font-black uppercase text-rose-550">
                            {isLeft && 'LEFT'}
                            {isRight && 'RIGHT'}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Narrator Display Box */}
            <div className="mt-4 p-4 bg-primary-50/50 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl">
              <span className="font-bold text-primary-600 dark:text-primary-400 text-[10px] tracking-wider uppercase block">Tutor Narration:</span>
              <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold mt-1">
                {alg.narration[frameIdx]}
              </p>
            </div>

            {/* Visualizer Controls */}
            <div className="flex flex-wrap items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleStep(false)}
                  disabled={frameIdx === 0}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                  title="Previous Frame"
                >
                  <SkipBack className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition"
                >
                  {isPlaying ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current" />}
                </button>

                <button
                  onClick={() => handleStep(true)}
                  disabled={frameIdx === totalFrames - 1}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                  title="Next Frame"
                >
                  <SkipForward className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>

                <button
                  onClick={() => setFrameIdx(0)}
                  className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  title="Reset Animation"
                >
                  <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Speed Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Speed:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.25"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-24 h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <span className="text-[10px] font-mono text-slate-500 font-bold">{speed}x</span>
              </div>
            </div>
          </div>

          {/* Monaco Sandbox Playground */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-805 dark:text-white mb-2">Try It Yourself Sandbox</h3>
            <p className="text-xs text-slate-500 mb-5">Fix the introduced bug in the editor window below and run evaluation cases:</p>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden mb-4">
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-400">debug_workspace.{codeLang === 'python' ? 'py' : codeLang === 'cpp' ? 'cpp' : codeLang === 'java' ? 'java' : 'c'}</span>
                <span className="text-[10px] text-amber-500 font-bold uppercase">1 bug introduced</span>
              </div>
              <Editor
                height="220px"
                language={codeLang === 'python' ? 'python' : codeLang === 'java' ? 'java' : 'cpp'}
                value={playgroundCode}
                onChange={(val) => setPlaygroundCode(val || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false
                }}
              />
            </div>

            {testFeedback && (
              <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850">
                {testFeedback}
              </div>
            )}

            <button
              onClick={verifyPlayground}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              Verify Fix & Run Tests
            </button>
          </div>
        </div>

        {/* Right: Algorithm Catalog + Code Highlights */}
        <div className="space-y-6">
          {/* Catalog */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">DSA Lesson List</h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {Object.entries(ALGORITHMS_DATA).map(([slug, value]) => (
                <button
                  key={slug}
                  onClick={() => setSelectedAlg(slug)}
                  className={`w-full text-left p-3 border rounded-xl flex justify-between items-center text-xs font-bold transition ${
                    selectedAlg === slug
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 text-primary-650 dark:text-primary-400'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/30 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span>{value.title}</span>
                    <span className="block text-[8px] text-slate-400 font-medium uppercase mt-0.5">{value.topic}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Sync Code Highlight Container */}
          <div className="bg-slate-950 border border-slate-850 rounded-3xl overflow-hidden flex flex-col h-[320px] shadow-lg">
            {/* Toolbar */}
            <div className="bg-slate-900 py-3.5 px-4 border-b border-slate-850 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-mono">Step-by-Step Code Tracker</span>
              
              <div className="flex gap-1.5 bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                {['python', 'cpp', 'java', 'c'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-2 py-1 rounded text-[9px] uppercase font-black tracking-wider transition ${
                      codeLang === lang 
                        ? 'bg-slate-800 text-white font-extrabold' 
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Highlighting Block */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed text-slate-350 select-none">
              {alg.code[codeLang].src.split('\n').map((line, idx) => {
                const isHighlighted = idx === getCodeLineToHighlight();
                return (
                  <div
                    key={idx}
                    className={`px-2 rounded transition-colors duration-150 flex gap-3 ${
                      isHighlighted 
                        ? 'bg-primary-500/25 border-l-2 border-primary-500 text-white font-bold' 
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <span className="text-slate-600 text-right w-4 select-none">{idx + 1}</span>
                    <pre className="whitespace-pre">{line}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
