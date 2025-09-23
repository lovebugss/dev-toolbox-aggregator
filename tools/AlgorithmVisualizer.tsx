import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolState } from '../contexts/ToolStateContext';
import { ToolHeader } from '../components/ui/ToolHeader';
import { LabeledControl } from '../components/ui/LabeledControl';
import { ArrowRightIcon, PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, RefreshIcon } from '../components/icons/Icons';
import { ThemeContext } from '../App';

// --- TYPES AND STATE ---
type Algorithm = 'bubbleSort' | 'selectionSort' | 'insertionSort' | 'mergeSort' | 'quickSort';
type Language = 'pseudo' | 'javascript' | 'python' | 'java' | 'go';
type HighlightColor = 'compare' | 'swap' | 'sorted' | 'pivot' | 'overwrite' | 'boundary';

interface Step {
    array: number[];
    highlights: Record<number, HighlightColor>;
    codeLine?: number;
}

interface AlgorithmVisualizerState {
    inputString: string;
    arraySize: number;
    speed: number;
    algorithm: Algorithm;
    language: Language;
}

// --- ALGORITHM IMPLEMENTATIONS ---
const getBubbleSortSteps = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    const n = arr.length;
    let newArr = [...arr];
    steps.push({ array: [...newArr], highlights: {}, codeLine: 1 });
    for (let i = 0; i < n - 1; i++) {
        steps.push({ array: [...newArr], highlights: {}, codeLine: 2 });
        for (let j = 0; j < n - i - 1; j++) {
            steps.push({ array: [...newArr], highlights: { [j]: 'compare', [j + 1]: 'compare' }, codeLine: 3 });
            if (newArr[j] > newArr[j + 1]) {
                steps.push({ array: [...newArr], highlights: { [j]: 'swap', [j + 1]: 'swap' }, codeLine: 4 });
                [newArr[j], newArr[j + 1]] = [newArr[j + 1], newArr[j]];
                steps.push({ array: [...newArr], highlights: { [j]: 'swap', [j + 1]: 'swap' }, codeLine: 5 });
            }
        }
        const highlights: Record<number, HighlightColor> = {};
        for (let k = n - 1 - i; k < n; k++) { highlights[k] = 'sorted'; }
        steps.push({ array: [...newArr], highlights });
    }
    const finalHighlights: Record<number, HighlightColor> = {};
    for (let k = 0; k < n; k++) { finalHighlights[k] = 'sorted'; }
    steps.push({ array: [...newArr], highlights: finalHighlights });
    return steps;
};

const getSelectionSortSteps = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    const n = arr.length;
    let newArr = [...arr];
    steps.push({ array: [...newArr], highlights: {}, codeLine: 1 });
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        steps.push({ array: [...newArr], highlights: { [i]: 'pivot' }, codeLine: 2 });
        steps.push({ array: [...newArr], highlights: { [i]: 'pivot' }, codeLine: 3 });
        for (let j = i + 1; j < n; j++) {
            steps.push({ array: [...newArr], highlights: { [i]: 'pivot', [minIdx]: 'compare', [j]: 'compare' }, codeLine: 4 });
            if (newArr[j] < newArr[minIdx]) {
                minIdx = j;
                steps.push({ array: [...newArr], highlights: { [i]: 'pivot', [minIdx]: 'compare' }, codeLine: 5 });
            }
        }
        steps.push({ array: [...newArr], highlights: { [i]: 'swap', [minIdx]: 'swap' }, codeLine: 6 });
        [newArr[i], newArr[minIdx]] = [newArr[minIdx], newArr[i]];
        const highlights: Record<number, HighlightColor> = { [i]: 'swap', [minIdx]: 'swap' };
        for (let k = 0; k <= i; k++) { highlights[k] = 'sorted'; }
        steps.push({ array: [...newArr], highlights, codeLine: 6 });
    }
    const finalHighlights: Record<number, HighlightColor> = {};
    for (let k = 0; k < n; k++) { finalHighlights[k] = 'sorted'; }
    steps.push({ array: [...newArr], highlights: finalHighlights });
    return steps;
};

const getInsertionSortSteps = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    const n = arr.length;
    let newArr = [...arr];
    steps.push({ array: [...newArr], highlights: {0: 'sorted'}, codeLine: 1 });
    for (let i = 1; i < n; i++) {
        let key = newArr[i];
        steps.push({ array: [...newArr], highlights: { [i]: 'pivot' }, codeLine: 2 });
        let j = i - 1;
        steps.push({ array: [...newArr], highlights: { [i]: 'pivot' }, codeLine: 3 });
        while (j >= 0 && newArr[j] > key) {
            steps.push({ array: [...newArr], highlights: { [j]: 'compare', [i]: 'pivot' }, codeLine: 4 });
            newArr[j + 1] = newArr[j];
            steps.push({ array: [...newArr], highlights: { [j + 1]: 'overwrite', [i]: 'pivot' }, codeLine: 5 });
            j = j - 1;
            steps.push({ array: [...newArr], highlights: { [i]: 'pivot' }, codeLine: 6 });
        }
        newArr[j + 1] = key;
        const highlights: Record<number, HighlightColor> = { [j + 1]: 'overwrite' };
        for(let k=0; k<=i; k++) highlights[k] = 'sorted';
        steps.push({ array: [...newArr], highlights, codeLine: 7 });
    }
    const finalHighlights: Record<number, HighlightColor> = {};
    for (let k = 0; k < n; k++) { finalHighlights[k] = 'sorted'; }
    steps.push({ array: [...newArr], highlights: finalHighlights });
    return steps;
};

const getMergeSortSteps = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    let newArr = [...arr];

    function merge(l: number, m: number, r: number) {
        let n1 = m - l + 1;
        let n2 = r - m;
        let L = new Array(n1);
        let R = new Array(n2);
        
        let highlights: Record<number, HighlightColor> = {};
        for(let i=l; i<=r; i++) highlights[i] = 'boundary';
        steps.push({array: [...newArr], highlights, codeLine: 9});

        for (let i = 0; i < n1; i++) L[i] = newArr[l + i];
        for (let j = 0; j < n2; j++) R[j] = newArr[m + 1 + j];

        let i = 0, j = 0, k = l;
        steps.push({array: [...newArr], highlights, codeLine: 14});
        while (i < n1 && j < n2) {
            highlights[l+i] = 'compare';
            highlights[m+1+j] = 'compare';
            steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 15});
            if (L[i] <= R[j]) {
                newArr[k] = L[i];
                highlights[k] = 'overwrite';
                steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 16});
                delete highlights[l+i];
                i++;
            } else {
                newArr[k] = R[j];
                highlights[k] = 'overwrite';
                steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 19});
                delete highlights[m+1+j];
                j++;
            }
            k++;
        }
        
        steps.push({array: [...newArr], highlights, codeLine: 22});
        while (i < n1) {
            newArr[k] = L[i];
            highlights[k] = 'overwrite';
            steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 23});
            i++; k++;
        }
        
        steps.push({array: [...newArr], highlights, codeLine: 25});
        while (j < n2) {
            newArr[k] = R[j];
            highlights[k] = 'overwrite';
            steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 26});
            j++; k++;
        }
        
        for(let z=l; z<=r; z++) highlights[z] = 'sorted';
        steps.push({array: [...newArr], highlights});
    }

    function mergeSortRecursive(l: number, r: number) {
        steps.push({array: [...newArr], highlights: {}, codeLine: 2});
        if (l >= r) return;
        let m = l + Math.floor((r - l) / 2);
        steps.push({array: [...newArr], highlights: {}, codeLine: 3});
        mergeSortRecursive(l, m);
        steps.push({array: [...newArr], highlights: {}, codeLine: 4});
        mergeSortRecursive(m + 1, r);
        steps.push({array: [...newArr], highlights: {}, codeLine: 5});
        merge(l, m, r);
        steps.push({array: [...newArr], highlights: {}, codeLine: 6});
    }
    
    mergeSortRecursive(0, newArr.length - 1);
    const finalHighlights: Record<number, HighlightColor> = {};
    for (let k = 0; k < arr.length; k++) { finalHighlights[k] = 'sorted'; }
    steps.push({ array: [...newArr], highlights: finalHighlights });
    return steps;
};

const getQuickSortSteps = (arr: number[]): Step[] => {
    const steps: Step[] = [];
    let newArr = [...arr];

    function partition(low: number, high: number): number {
        let pivot = newArr[high];
        let highlights: Record<number, HighlightColor> = {};
        for(let k=low; k<=high; k++) highlights[k] = 'boundary';
        highlights[high] = 'pivot';
        steps.push({array: [...newArr], highlights, codeLine: 8});

        let i = low - 1;
        steps.push({array: [...newArr], highlights, codeLine: 9});
        for (let j = low; j < high; j++) {
            highlights[j] = 'compare';
            steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 10});
            steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 11});
            if (newArr[j] < pivot) {
                i++;
                highlights[i] = 'swap';
                highlights[j] = 'swap';
                steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 13});
                [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
                steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 13});
            }
            delete highlights[i];
            delete highlights[j];
        }
        
        highlights[i+1] = 'swap';
        highlights[high] = 'swap';
        steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 14});
        [newArr[i + 1], newArr[high]] = [newArr[high], newArr[i + 1]];
        steps.push({array: [...newArr], highlights: {...highlights}, codeLine: 14});

        return i + 1;
    }

    function quickSortRecursive(low: number, high: number) {
        steps.push({array: [...newArr], highlights: {}, codeLine: 2});
        if (low < high) {
            let pi = partition(low, high);
            const highlights: Record<number, HighlightColor> = {};
            for(let k=0; k<newArr.length; k++) {
                const step = steps[steps.length-1];
                if(step && step.highlights[k] === 'sorted') {
                    highlights[k] = 'sorted';
                }
            }
            highlights[pi] = 'sorted';
            steps.push({array: [...newArr], highlights, codeLine: 3});
            
            quickSortRecursive(low, pi - 1);
            steps.push({array: [...newArr], highlights, codeLine: 4});
            
            quickSortRecursive(pi + 1, high);
            steps.push({array: [...newArr], highlights, codeLine: 5});
        }
    }

    quickSortRecursive(0, newArr.length - 1);
    const finalHighlights: Record<number, HighlightColor> = {};
    for (let k = 0; k < arr.length; k++) { finalHighlights[k] = 'sorted'; }
    steps.push({ array: [...newArr], highlights: finalHighlights });
    return steps;
};

const ALGORITHMS: Record<Algorithm, { nameKey: string, generator: (arr: number[]) => Step[], code: Record<Language, string[]> }> = {
    bubbleSort: {
        nameKey: 'tools.algorithmVisualizer.bubbleSort', generator: getBubbleSortSteps, code: {
            pseudo: ['function bubbleSort(arr):','  for i from 0 to n-2','    for j from 0 to n-i-2','      if arr[j] > arr[j+1]','        swap(arr[j], arr[j+1])'],
            javascript: ['function bubbleSort(arr) {','  for (let i = 0; i < arr.length - 1; i++) {','    for (let j = 0; j < arr.length - i - 1; j++) {','      if (arr[j] > arr[j + 1]) {','        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];','      }','    }','  }','}'],
            python: ['def bubble_sort(arr):','  for i in range(len(arr) - 1):','    for j in range(len(arr) - i - 1):','      if arr[j] > arr[j+1]:','        arr[j], arr[j+1] = arr[j+1], arr[j]'],
            java: ['void bubbleSort(int arr[]) {','  for (int i = 0; i < arr.length - 1; i++)','    for (int j = 0; j < arr.length - i - 1; j++)','      if (arr[j] > arr[j+1]) {','        int temp = arr[j];','        arr[j] = arr[j+1];','        arr[j+1] = temp;','      }','}'],
            go: ['func bubbleSort(arr []int) {','  for i := 0; i < len(arr)-1; i++ {','    for j := 0; j < len(arr)-i-1; j++ {','      if arr[j] > arr[j+1] {','        arr[j], arr[j+1] = arr[j+1], arr[j]','      }','    }','  }','}']
        }
    },
    selectionSort: {
        nameKey: 'tools.algorithmVisualizer.selectionSort', generator: getSelectionSortSteps, code: {
            pseudo: ['function selectionSort(arr):','  for i from 0 to n-2','    minIndex = i','    for j from i+1 to n-1','      if arr[j] < arr[minIndex]','        minIndex = j','    swap(arr[i], arr[minIndex])'],
            javascript: ['function selectionSort(arr) {','  for (let i = 0; i < arr.length - 1; i++) {','    let minIndex = i;','    for (let j = i + 1; j < arr.length; j++) {','      if (arr[j] < arr[minIndex]) {','        minIndex = j;','      }','    }','    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];','  }','}'],
            python: ['def selection_sort(arr):','  for i in range(len(arr) - 1):','    min_index = i','    for j in range(i + 1, len(arr)):','      if arr[j] < arr[min_index]:','        min_index = j','    arr[i], arr[min_index] = arr[min_index], arr[i]'],
            java: ['void selectionSort(int arr[]) {','  for (int i = 0; i < arr.length - 1; i++) {','    int minIndex = i;','    for (int j = i + 1; j < arr.length; j++) {','      if (arr[j] < arr[minIndex]) {','        minIndex = j;','      }','    }','    int temp = arr[i];','    arr[i] = arr[minIndex];','    arr[minIndex] = temp;','  }','}'],
            go: ['func selectionSort(arr []int) {','  for i := 0; i < len(arr)-1; i++ {','    minIndex := i','    for j := i + 1; j < len(arr); j++ {','      if arr[j] < arr[minIndex] {','        minIndex = j','      }','    }','    arr[i], arr[minIndex] = arr[minIndex], arr[i]','  }','}']
        }
    },
    insertionSort: {
        nameKey: 'tools.algorithmVisualizer.insertionSort', generator: getInsertionSortSteps, code: {
            pseudo: ['function insertionSort(arr):','  for i from 1 to n-1','    key = arr[i]','    j = i - 1','    while j >= 0 and arr[j] > key','      arr[j+1] = arr[j]','      j = j - 1','    arr[j+1] = key'],
            javascript: ['function insertionSort(arr) {','  for (let i = 1; i < arr.length; i++) {','    let key = arr[i];','    let j = i - 1;','    while (j >= 0 && arr[j] > key) {','      arr[j + 1] = arr[j];','      j = j - 1;','    }','    arr[j + 1] = key;','  }','}'],
            python: ['def insertion_sort(arr):','  for i in range(1, len(arr)):','    key = arr[i]','    j = i - 1','    while j >= 0 and arr[j] > key:','      arr[j+1] = arr[j]','      j -= 1','    arr[j+1] = key'],
            java: ['void insertionSort(int arr[]) {','  for (int i = 1; i < arr.length; i++) {','    int key = arr[i];','    int j = i - 1;','    while (j >= 0 && arr[j] > key) {','      arr[j + 1] = arr[j];','      j = j - 1;','    }','    arr[j + 1] = key;','  }','}'],
            go: ['func insertionSort(arr []int) {','  for i := 1; i < len(arr); i++ {','    key := arr[i]','    j := i - 1','    for j >= 0 && arr[j] > key {','      arr[j+1] = arr[j]','      j = j - 1','    }','    arr[j+1] = key','  }','}']
        }
    },
    mergeSort: {
        nameKey: 'tools.algorithmVisualizer.mergeSort', 
        generator: getMergeSortSteps, 
        code: {
            pseudo: [
                'function mergeSort(arr, l, r):',
                '  if l >= r then return',
                '  m = l + floor((r-l)/2)',
                '  mergeSort(arr, l, m)',
                '  mergeSort(arr, m+1, r)',
                '  merge(arr, l, m, r)',
                '',
                'function merge(arr, l, m, r):',
                '  n1 = m - l + 1, n2 = r - m',
                '  L = new array of size n1',
                '  R = new array of size n2',
                '  copy arr[l..m] to L',
                '  copy arr[m+1..r] to R',
                '  i=0, j=0, k=l',
                '  while i < n1 and j < n2:',
                '    if L[i] <= R[j]:',
                '      arr[k] = L[i]',
                '      i++',
                '    else:',
                '      arr[k] = R[j]',
                '      j++',
                '    k++',
                '  while i < n1:',
                '    arr[k] = L[i]',
                '    i++, k++',
                '  while j < n2:',
                '    arr[k] = R[j]',
                '    j++, k++',
            ],
            javascript: [
                'function mergeSort(arr, l, r) {',
                '  if (l >= r) return;',
                '  const m = l + Math.floor((r - l) / 2);',
                '  mergeSort(arr, l, m);',
                '  mergeSort(arr, m + 1, r);',
                '  merge(arr, l, m, r);',
                '}',
                '',
                'function merge(arr, l, m, r) {',
                '  let n1 = m - l + 1, n2 = r - m;',
                '  let L = arr.slice(l, m + 1);',
                '  let R = arr.slice(m + 1, r + 1);',
                '  let i = 0, j = 0, k = l;',
                '  while (i < n1 && j < n2) {',
                '    if (L[i] <= R[j]) {',
                '      arr[k] = L[i]; i++;',
                '    } else {',
                '      arr[k] = R[j]; j++;',
                '    }',
                '    k++;',
                '  }',
                '  while (i < n1) arr[k++] = L[i++];',
                '  while (j < n2) arr[k++] = R[j++];',
                '}',
            ],
            python: [
                'def merge_sort(arr, l, r):',
                '  if l >= r: return',
                '  m = l + (r - l) // 2',
                '  merge_sort(arr, l, m)',
                '  merge_sort(arr, m + 1, r)',
                '  merge(arr, l, m, r)',
                '',
                'def merge(arr, l, m, r):',
                '  n1, n2 = m - l + 1, r - m',
                '  L, R = arr[l : m+1], arr[m+1 : r+1]',
                '  i, j, k = 0, 0, l',
                '  while i < n1 and j < n2:',
                '    if L[i] <= R[j]:',
                '      arr[k] = L[i]; i += 1',
                '    else:',
                '      arr[k] = R[j]; j += 1',
                '    k += 1',
                '  while i < n1:',
                '    arr[k] = L[i]; i += 1; k += 1',
                '  while j < n2:',
                '    arr[k] = R[j]; j += 1; k += 1',
            ],
            java: [
                'void mergeSort(int arr[], int l, int r) {',
                '  if (l >= r) return;',
                '  int m = l + (r - l) / 2;',
                '  mergeSort(arr, l, m);',
                '  mergeSort(arr, m + 1, r);',
                '  merge(arr, l, m, r);',
                '}',
                '',
                'void merge(int arr[], int l, int m, int r) {',
                '  int n1 = m - l + 1, n2 = r - m;',
                '  int L[] = new int[n1], R[] = new int[n2];',
                '  for (int i=0; i<n1; ++i) L[i] = arr[l + i];',
                '  for (int j=0; j<n2; ++j) R[j] = arr[m + 1 + j];',
                '  int i = 0, j = 0, k = l;',
                '  while (i < n1 && j < n2) {',
                '    if (L[i] <= R[j]) {',
                '      arr[k] = L[i]; i++;',
                '    } else {',
                '      arr[k] = R[j]; j++;',
                '    }',
                '    k++;',
                '  }',
                '  while (i < n1) arr[k++] = L[i++];',
                '  while (j < n2) arr[k++] = R[j++];',
                '}',
            ],
            go: [
                'func mergeSort(arr []int, l, r int) {',
                '  if l >= r { return }',
                '  m := l + (r-l)/2',
                '  mergeSort(arr, l, m)',
                '  mergeSort(arr, m+1, r)',
                '  merge(arr, l, m, r)',
                '}',
                '',
                'func merge(arr []int, l, m, r int) {',
                '  n1, n2 := m-l+1, r-m',
                '  L, R := make([]int, n1), make([]int, n2)',
                '  copy(L, arr[l:m+1])',
                '  copy(R, arr[m+1:r+1])',
                '  i, j, k := 0, 0, l',
                '  for i < n1 && j < n2 {',
                '    if L[i] <= R[j] {',
                '      arr[k] = L[i]; i++',
                '    } else {',
                '      arr[k] = R[j]; j++',
                '    }',
                '    k++',
                '  }',
                '  for i < n1 { arr[k] = L[i]; i++; k++ }',
                '  for j < n2 { arr[k] = R[j]; j++; k++ }',
                '}',
            ]
        }
    },
    quickSort: {
        nameKey: 'tools.algorithmVisualizer.quickSort', 
        generator: getQuickSortSteps, 
        code: {
            pseudo: [
                'function quickSort(arr, low, high):',
                '  if low < high:',
                '    pi = partition(arr, low, high)',
                '    quickSort(arr, low, pi - 1)',
                '    quickSort(arr, pi + 1, high)',
                '',
                'function partition(arr, low, high):',
                '  pivot = arr[high]',
                '  i = low - 1',
                '  for j from low to high-1:',
                '    if arr[j] < pivot:',
                '      i++',
                '      swap(arr[i], arr[j])',
                '  swap(arr[i+1], arr[high])',
                '  return i + 1',
            ],
            javascript: [
                'function quickSort(arr, low, high) {',
                '  if (low < high) {',
                '    const pi = partition(arr, low, high);',
                '    quickSort(arr, low, pi - 1);',
                '    quickSort(arr, pi + 1, high);',
                '  }',
                '}',
                '',
                'function partition(arr, low, high) {',
                '  let pivot = arr[high];',
                '  let i = low - 1;',
                '  for (let j = low; j < high; j++) {',
                '    if (arr[j] < pivot) {',
                '      i++;',
                '      [arr[i], arr[j]] = [arr[j], arr[i]];',
                '    }',
                '  }',
                '  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];',
                '  return i + 1;',
                '}',
            ],
            python: [
                'def quick_sort(arr, low, high):',
                '  if low < high:',
                '    pi = partition(arr, low, high)',
                '    quick_sort(arr, low, pi - 1)',
                '    quick_sort(arr, pi + 1, high)',
                '',
                'def partition(arr, low, high):',
                '  pivot = arr[high]',
                '  i = low - 1',
                '  for j in range(low, high):',
                '    if arr[j] < pivot:',
                '      i += 1',
                '      arr[i], arr[j] = arr[j], arr[i]',
                '  arr[i + 1], arr[high] = arr[high], arr[i + 1]',
                '  return i + 1',
            ],
            java: [
                'void quickSort(int arr[], int low, int high) {',
                '  if (low < high) {',
                '    int pi = partition(arr, low, high);',
                '    quickSort(arr, low, pi - 1);',
                '    quickSort(arr, pi + 1, high);',
                '  }',
                '}',
                '',
                'int partition(int arr[], int low, int high) {',
                '  int pivot = arr[high];',
                '  int i = (low - 1);',
                '  for (int j = low; j < high; j++) {',
                '    if (arr[j] < pivot) {',
                '      i++;',
                '      int temp = arr[i];',
                '      arr[i] = arr[j];',
                '      arr[j] = temp;',
                '    }',
                '  }',
                '  int temp = arr[i + 1];',
                '  arr[i + 1] = arr[high];',
                '  arr[high] = temp;',
                '  return i + 1;',
                '}',
            ],
            go: [
                'func quickSort(arr []int, low, high int) {',
                '  if low < high {',
                '    pi := partition(arr, low, high)',
                '    quickSort(arr, low, pi-1)',
                '    quickSort(arr, pi+1, high)',
                '  }',
                '}',
                '',
                'func partition(arr []int, low, high int) int {',
                '  pivot := arr[high]',
                '  i := low - 1',
                '  for j := low; j < high; j++ {',
                '    if arr[j] < pivot {',
                '      i++',
                '      arr[i], arr[j] = arr[j], arr[i]',
                '    }',
                '  }',
                '  arr[i+1], arr[high] = arr[high], arr[i+1]',
                '  return i + 1',
                '}',
            ]
        }
    }
};

// --- MAIN COMPONENT ---
const AlgorithmVisualizer: React.FC = () => {
    const { t } = useTranslation();
    const { state, setState } = useToolState<AlgorithmVisualizerState>('algorithm-visualizer', {
        inputString: '29, 72, 98, 13, 87, 66, 52, 51, 36',
        arraySize: 20,
        speed: 50,
        algorithm: 'bubbleSort',
        language: 'pseudo',
    });
    const { theme } = useContext(ThemeContext);

    const [initialArray, setInitialArray] = useState<number[]>([]);
    const [steps, setSteps] = useState<Step[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSorted, setIsSorted] = useState(false);

    const parseInput = useCallback(() => {
        const parsed = state.inputString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        setInitialArray(parsed);
        setCurrentStep(0);
        setSteps([]);
        setIsPlaying(false);
        setIsSorted(false);
    }, [state.inputString]);
    
    useEffect(() => {
        parseInput();
    }, [parseInput]);
    
    const randomizeArray = () => {
        const newArray = Array.from({ length: state.arraySize }, () => Math.floor(Math.random() * 95) + 5);
        setState(s => ({...s, inputString: newArray.join(', ')}));
    };
    
    const handleSort = () => {
        if (initialArray.length === 0) return;
        const newSteps = ALGORITHMS[state.algorithm].generator(initialArray);
        setSteps(newSteps);
        setCurrentStep(0);
        setIsPlaying(true);
        setIsSorted(false);
    };

    const handleReset = () => {
        parseInput();
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setIsPlaying(false);
            setCurrentStep(prev => prev - 1);
            setIsSorted(false);
        }
    };
    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            setIsPlaying(false);
            const nextStepIndex = currentStep + 1;
            setCurrentStep(nextStepIndex);
            if (nextStepIndex >= steps.length - 1) {
                setIsSorted(true);
            }
        }
    };

    const delay = useMemo(() => {
        const maxDelay = 1000;
        const minDelay = 10;
        return maxDelay - ((state.speed - 1) / 99) * (maxDelay - minDelay);
    }, [state.speed]);

    useEffect(() => {
        if (!isPlaying || currentStep >= steps.length - 1) {
            if (currentStep >= steps.length - 1 && steps.length > 0) {
                setIsSorted(true);
                setIsPlaying(false);
            }
            return;
        }
        const timeout = setTimeout(() => {
            setCurrentStep(prev => prev + 1);
        }, delay);
        return () => clearTimeout(timeout);
    }, [currentStep, isPlaying, steps, delay]);
    
    const currentDisplay = useMemo(() => {
        if (steps.length > 0 && currentStep < steps.length) {
            return steps[currentStep];
        }
        return { array: initialArray, highlights: {}, codeLine: 0 };
    }, [steps, currentStep, initialArray]);

    const maxVal = Math.max(1, ...currentDisplay.array);
    const selectedAlgorithmCode = ALGORITHMS[state.algorithm].code[state.language];
    const codeLineHeight = 24; // Corresponds to leading-6 in Tailwind
    
    const highlightColorHex: Record<HighlightColor, string> = {
        compare: '#eab308', // yellow-500
        swap: '#ef4444',    // red-500
        sorted: '#22c55e',   // green-500
        pivot: '#a855f7',   // purple-500
        overwrite: '#f97316', // orange-500
        boundary: '#3b82f6'  // blue-500
    };
    const defaultBarColor = theme === 'dark' ? '#6366F1' : '#4338CA'; // d-accent and accent

    const legendItems = [
        { color: defaultBarColor, labelKey: 'legendUnsorted' },
        { color: highlightColorHex.compare, labelKey: 'legendComparing' },
        { color: highlightColorHex.swap, labelKey: 'legendSwapping' },
        { color: highlightColorHex.pivot, labelKey: 'legendPivot' },
        { color: highlightColorHex.overwrite, labelKey: 'legendOverwrite' },
        { color: highlightColorHex.boundary, labelKey: 'legendBoundary' },
        { color: highlightColorHex.sorted, labelKey: 'legendSorted' },
    ];


    return (
        <div className="flex flex-col h-full">
            <ToolHeader title={t('tools.algorithmVisualizer.pageTitle')} description={t('tools.algorithmVisualizer.pageDescription')} />

            {/* Controls */}
            <div className="flex-shrink-0 bg-secondary dark:bg-d-secondary p-4 rounded-lg border border-border-color dark:border-d-border-color mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
                     <div className="xl:col-span-2">
                        <LabeledControl label={t('tools.algorithmVisualizer.arrayInput')}>
                           <div className="flex gap-2">
                            <input type="text" value={state.inputString} onChange={e => setState(s => ({...s, inputString: e.target.value}))} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md" />
                            <button onClick={randomizeArray} className="px-4 py-2 text-sm bg-border-color dark:bg-d-border-color rounded-md">{t('tools.algorithmVisualizer.randomize')}</button>
                           </div>
                        </LabeledControl>
                     </div>
                     <LabeledControl label={t('tools.algorithmVisualizer.algorithm')}>
                         <select value={state.algorithm} onChange={e => setState(s => ({...s, algorithm: e.target.value as Algorithm}))} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md">
                            {Object.entries(ALGORITHMS).map(([key, {nameKey}]) => <option key={key} value={key}>{t(nameKey)}</option>)}
                         </select>
                     </LabeledControl>
                     <LabeledControl label={t('tools.algorithmVisualizer.language')}>
                         <select value={state.language} onChange={e => setState(s => ({...s, language: e.target.value as Language}))} className="w-full p-2 bg-primary dark:bg-d-primary rounded-md">
                            <option value="pseudo">{t('tools.algorithmVisualizer.pseudoCode')}</option>
                            <option value="javascript">{t('tools.algorithmVisualizer.javascript')}</option>
                            <option value="python">{t('tools.algorithmVisualizer.python')}</option>
                            <option value="java">{t('tools.algorithmVisualizer.java')}</option>
                            <option value="go">{t('tools.algorithmVisualizer.go')}</option>
                         </select>
                     </LabeledControl>
                      <LabeledControl label={t('tools.algorithmVisualizer.speed')}>
                        <input type="range" min="1" max="100" value={state.speed} onChange={e => setState(s => ({...s, speed: parseInt(e.target.value)}))} className="w-full accent-accent dark:accent-d-accent" />
                     </LabeledControl>
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                    <button onClick={handleSort} disabled={isPlaying || (steps.length > 0 && !isSorted)} className="px-4 py-2 bg-accent text-white rounded-md disabled:opacity-50">{t('tools.algorithmVisualizer.sort')}</button>
                    <button onClick={handleReset} className="px-4 py-2 bg-border-color dark:bg-d-border-color rounded-md"><RefreshIcon className="w-5 h-5 mx-auto"/></button>
                    <button onClick={handlePrevStep} disabled={isPlaying || currentStep <= 0} title={t('tools.algorithmVisualizer.previousStep')} className="px-4 py-2 bg-border-color dark:bg-d-border-color rounded-md disabled:opacity-50"><SkipBackIcon /></button>
                    <button onClick={() => setIsPlaying(!isPlaying)} disabled={steps.length === 0 || isSorted} className="px-4 py-2 bg-border-color dark:bg-d-border-color rounded-md disabled:opacity-50">{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                    <button onClick={handleNextStep} disabled={isPlaying || currentStep >= steps.length - 1} title={t('tools.algorithmVisualizer.nextStep')} className="px-4 py-2 bg-border-color dark:bg-d-border-color rounded-md disabled:opacity-50"><SkipForwardIcon /></button>
                </div>
            </div>

            {/* Visualization & Code */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[300px]">
                <div className="bg-secondary dark:bg-d-secondary p-4 rounded-lg border border-border-color dark:border-d-border-color flex flex-col justify-between">
                    <div className="flex-grow flex items-center justify-center min-h-[200px]">
                        <svg viewBox={`0 0 500 250`} className="w-full h-full">
                            {(() => {
                                const svgWidth = 500;
                                const svgHeight = 250;
                                const margin = { top: 20, right: 0, bottom: 0, left: 0 };
                                const chartWidth = svgWidth - margin.left - margin.right;
                                const chartHeight = svgHeight - margin.top - margin.bottom;

                                const array = currentDisplay.array;
                                const n = array.length;
                                const barWidth = n > 0 ? chartWidth / n : 0;
                                const gap = 2;

                                return array.map((value, index) => {
                                    const barHeight = (value / maxVal) * chartHeight;
                                    const x = margin.left + index * barWidth;
                                    const y = margin.top + chartHeight - barHeight;
                                    const highlight = currentDisplay.highlights[index];
                                    const color = highlight ? highlightColorHex[highlight] : defaultBarColor;

                                    return (
                                        <g key={index}>
                                            <rect
                                                x={x + gap / 2}
                                                y={y}
                                                width={Math.max(0, barWidth - gap)}
                                                height={barHeight}
                                                fill={color}
                                                rx="1"
                                                ry="1"
                                                style={{ transition: `all ${Math.min(delay, 300)}ms ease-in-out` }}
                                            />
                                            {array.length <= 40 && (
                                                <text
                                                    x={x + barWidth / 2}
                                                    y={y - 4}
                                                    textAnchor="middle"
                                                    fontSize="10"
                                                    className="fill-current text-text-secondary dark:text-d-text-secondary"
                                                >
                                                    {value}
                                                </text>
                                            )}
                                        </g>
                                    );
                                });
                            })()}
                        </svg>
                    </div>
                     <div className="flex-shrink-0 pt-4 mt-4 border-t border-border-color dark:border-d-border-color">
                        <h4 className="text-sm font-semibold mb-2">{t('tools.algorithmVisualizer.legend')}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary dark:text-d-text-secondary">
                          {legendItems.map(item => (
                            <div key={item.labelKey} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm" style={{backgroundColor: item.color}}></div>
                              <span>{t(`tools.algorithmVisualizer.${item.labelKey}`)}</span>
                            </div>
                          ))}
                        </div>
                    </div>
                </div>
                <div className="bg-secondary dark:bg-d-secondary p-4 rounded-lg border border-border-color dark:border-d-border-color overflow-auto">
                    <div className="relative">
                        <pre className="font-mono text-sm leading-6 text-text-primary dark:text-d-text-primary whitespace-pre">
                             {currentDisplay.codeLine && currentDisplay.codeLine > 0 && currentDisplay.codeLine <= selectedAlgorithmCode.length && (
                                <ArrowRightIcon
                                    className="absolute left-0 text-accent dark:text-d-accent transition-all duration-200 ease-in-out"
                                    style={{ top: (currentDisplay.codeLine - 1) * codeLineHeight, transform: 'translateY(2px)' }}
                                />
                            )}
                            {selectedAlgorithmCode.map((line, index) => (
                                <code
                                    key={index}
                                    className={`block pl-8 transition-colors duration-200 ${currentDisplay.codeLine === index + 1 ? 'text-accent dark:text-d-accent font-bold' : ''}`}
                                >
                                    {line || ' '}
                                </code>
                            ))}
                        </pre>
                    </div>
                </div>
            </div>

            {isSorted && (
                <div className="text-center mt-4 text-lg font-semibold text-green-600 dark:text-green-400">
                    {t('tools.algorithmVisualizer.sorted')}
                </div>
            )}
        </div>
    );
};

export default AlgorithmVisualizer;