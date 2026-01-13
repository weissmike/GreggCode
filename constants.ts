
import { FolioGuide, Lesson } from './types';

export const LESSONS: Lesson[] = [
  {
    id: 'brief-1',
    title: 'Brief Forms - Part I',
    description: 'Foundational symbols for common words (A to Circular)',
    words: [
      { word: 'A', hint: 'A single dot', category: 'brief-form' },
      { word: 'About', hint: 'A large downward loop starting high', category: 'brief-form' },
      { word: 'Acknowledge', hint: 'A long curved upward stroke', category: 'brief-form' },
      { word: 'Advantage', hint: 'A sharp hook upwards', category: 'brief-form' },
      { word: 'After', hint: 'A small loop with a tail', category: 'brief-form' },
      { word: 'Am', hint: 'A long horizontal line', category: 'brief-form' },
      { word: 'Are', hint: 'A small forward curve', category: 'brief-form' },
      { word: 'At', hint: 'A sharp upward tick', category: 'brief-form' },
      { word: 'Be', hint: 'A large upward curve', category: 'brief-form' },
      { word: 'Can', hint: 'A small horizontal curve', category: 'brief-form' }
    ]
  },
  {
    id: 'brief-2',
    title: 'Brief Forms - Part II',
    description: 'Time and Identity (Experience to Of)',
    words: [
      { word: 'Experience', hint: 'An elongated S-like curve', category: 'brief-form' },
      { word: 'For', hint: 'A small downward comma', category: 'brief-form' },
      { word: 'From', hint: 'A long straight downward stroke', category: 'brief-form' },
      { word: 'Good', hint: 'A broad low curve', category: 'brief-form' },
      { word: 'Have', hint: 'An upward hook with a tail', category: 'brief-form' },
      { word: 'I', hint: 'A small circle loop', category: 'brief-form' },
      { word: 'In', hint: 'A short horizontal tick', category: 'brief-form' },
      { word: 'It', hint: 'A short downward tick', category: 'brief-form' },
      { word: 'Of', hint: 'A tiny hook at the base', category: 'brief-form' }
    ]
  },
  {
    id: 'brief-3',
    title: 'Brief Forms - Part III',
    description: 'Observation and Order (Opinion to Send)',
    words: [
      { word: 'Opinion', hint: 'A sharp vertical hook', category: 'brief-form' },
      { word: 'Opportunity', hint: 'A small high loop', category: 'brief-form' },
      { word: 'Order', hint: 'A long upward diagonal', category: 'brief-form' },
      { word: 'Public', hint: 'A vertical squiggle', category: 'brief-form' },
      { word: 'Question', hint: 'A small horizontal loop', category: 'brief-form' },
      { word: 'Satisfy', hint: 'A double hook stroke', category: 'brief-form' },
      { word: 'Send', hint: 'A low horizontal hook', category: 'brief-form' }
    ]
  },
  {
    id: 'brief-4',
    title: 'Brief Forms - Part IV',
    description: 'Common State and Action (Soon to When)',
    words: [
      { word: 'Soon', hint: 'A tiny horizontal tail', category: 'brief-form' },
      { word: 'Speak', hint: 'An S-curve followed by E-loop', category: 'brief-form' },
      { word: 'State', hint: 'A medium horizontal line with a tick', category: 'brief-form' },
      { word: 'The', hint: 'A short upward tick', category: 'brief-form' },
      { word: 'Think', hint: 'A medium curve with a dot', category: 'brief-form' },
      { word: 'When', hint: 'A long low hook', category: 'brief-form' }
    ]
  },
  {
    id: 'brief-5',
    title: 'Brief Forms - Part V',
    description: 'Space and Direction (Where to Your)',
    words: [
      { word: 'Where', hint: 'A small circle with a tail', category: 'brief-form' },
      { word: 'Which', hint: 'A medium vertical stroke', category: 'brief-form' },
      { word: 'Will', hint: 'A long low horizontal curve', category: 'brief-form' },
      { word: 'Wish', hint: 'A tiny upward hook', category: 'brief-form' },
      { word: 'With', hint: 'A long curved upward stroke', category: 'brief-form' },
      { word: 'Won', hint: 'A medium horizontal line', category: 'brief-form' },
      { word: 'Work', hint: 'A small horizontal squiggle', category: 'brief-form' },
      { word: 'World', hint: 'A low double-curve', category: 'brief-form' },
      { word: 'Worth', hint: 'A medium horizontal curve', category: 'brief-form' },
      { word: 'Would', hint: 'A long diagonal line', category: 'brief-form' },
      { word: 'Yesterday', hint: 'A long vertical loop', category: 'brief-form' },
      { word: 'You', hint: 'A small upward hook', category: 'brief-form' },
      { word: 'Your', hint: 'A small upward hook (same as You)', category: 'brief-form' }
    ]
  }
];

export const FOLIO_GUIDES: FolioGuide[] = [
  {
    id: 'brief-forms-1',
    title: 'Brief Forms - Part I',
    description: 'A to Any (quick reference)',
    type: 'built-in',
    assetUrl: '/folio/brief-forms-1.jpg'
  },
  {
    id: 'brief-forms-2',
    title: 'Brief Forms - Part II',
    description: 'Experience to Of (quick reference)',
    type: 'built-in',
    assetUrl: '/folio/brief-forms-2.jpg'
  },
  {
    id: 'brief-forms-3',
    title: 'Brief Forms - Part III',
    description: 'Opinion to Short (quick reference)',
    type: 'built-in',
    assetUrl: '/folio/brief-forms-3.jpg'
  },
  {
    id: 'brief-forms-4',
    title: 'Brief Forms - Part IV',
    description: 'Soon to When (quick reference)',
    type: 'built-in',
    assetUrl: '/folio/brief-forms-4.jpg'
  },
  {
    id: 'brief-forms-5',
    title: 'Brief Forms - Part V',
    description: 'Where to Your (quick reference)',
    type: 'built-in',
    assetUrl: '/folio/brief-forms-5.jpg'
  }
];

export const BRIEF_FORM_TEMPLATES: Array<{ word: string; tokens: string[] }> = [
  { word: 'A', tokens: ['e'] },
  { word: 'About', tokens: ['a'] },
  { word: 'Acknowledge', tokens: ['l'] },
  { word: 'Advantage', tokens: ['r', 's'] },
  { word: 'After', tokens: ['e', 's'] },
  { word: 'Am', tokens: ['m'] },
  { word: 'Are', tokens: ['r'] },
  { word: 'At', tokens: ['s'] },
  { word: 'Be', tokens: ['l'] },
  { word: 'Can', tokens: ['n'] },
  { word: 'Experience', tokens: ['r', 'l'] },
  { word: 'For', tokens: ['s'] },
  { word: 'From', tokens: ['d'] },
  { word: 'Good', tokens: ['m', 'r'] },
  { word: 'Have', tokens: ['r', 's'] },
  { word: 'I', tokens: ['e'] },
  { word: 'In', tokens: ['n'] },
  { word: 'It', tokens: ['t'] },
  { word: 'Of', tokens: ['s'] },
  { word: 'Opinion', tokens: ['r', 't'] },
  { word: 'Opportunity', tokens: ['e', 'r'] },
  { word: 'Order', tokens: ['l', 'n'] },
  { word: 'Public', tokens: ['l', 's'] },
  { word: 'Question', tokens: ['e', 'n'] },
  { word: 'Satisfy', tokens: ['s', 'r'] },
  { word: 'Send', tokens: ['n', 's'] },
  { word: 'Soon', tokens: ['n', 's'] },
  { word: 'Speak', tokens: ['s', 'e'] },
  { word: 'State', tokens: ['n', 's'] },
  { word: 'The', tokens: ['s'] },
  { word: 'Think', tokens: ['r', 'e'] },
  { word: 'When', tokens: ['b'] },
  { word: 'Where', tokens: ['e', 's'] },
  { word: 'Which', tokens: ['t'] },
  { word: 'Will', tokens: ['m', 'r'] },
  { word: 'Wish', tokens: ['r'] },
  { word: 'With', tokens: ['l'] },
  { word: 'Won', tokens: ['n'] },
  { word: 'Work', tokens: ['n', 's'] },
  { word: 'World', tokens: ['m', 'r'] },
  { word: 'Worth', tokens: ['m'] },
  { word: 'Would', tokens: ['l', 'n'] },
  { word: 'Yesterday', tokens: ['d', 'e'] },
  { word: 'You', tokens: ['r'] },
  { word: 'Your', tokens: ['r'] }
];

export const GLYPH_OPTIONS: Array<{ key: string; label: string; hint: string; command: string }> = [
  { key: 't', label: 'T', hint: 'Short Down', command: '\\t' },
  { key: 'd', label: 'D', hint: 'Long Down', command: '\\d' },
  { key: 'n', label: 'N', hint: 'Short Horiz', command: '\\n' },
  { key: 'm', label: 'M', hint: 'Long Horiz', command: '\\m' },
  { key: 'p', label: 'P', hint: 'Short L-Curve', command: '\\p' },
  { key: 'b', label: 'B', hint: 'Long L-Curve', command: '\\b' },
  { key: 'f', label: 'F', hint: 'Short R-Curve', command: '\\f' },
  { key: 'v', label: 'V', hint: 'Long R-Curve', command: '\\v' },
  { key: 'r', label: 'R', hint: 'Short Up-Curve', command: '\\r' },
  { key: 'l', label: 'L', hint: 'Long Up-Curve', command: '\\l' },
  { key: 'e', label: 'E', hint: 'Small Circle', command: '\\e' },
  { key: 'a', label: 'A', hint: 'Large Circle', command: '\\a' },
  { key: 's', label: 'S', hint: 'Tick', command: '\\s' },
  { key: 'space', label: 'Space', hint: 'Gap', command: '\\space' },
  { key: 'tn', label: 'T+N', hint: 'Down + short horiz', command: '\\t \\n' },
  { key: 'tm', label: 'T+M', hint: 'Down + long horiz', command: '\\t \\m' },
  { key: 'dn', label: 'D+N', hint: 'Long down + short horiz', command: '\\d \\n' },
  { key: 'rm', label: 'R+M', hint: 'Up-curve + long horiz', command: '\\r \\m' },
  { key: 'rn', label: 'R+N', hint: 'Up-curve + short horiz', command: '\\r \\n' },
  { key: 'ln', label: 'L+N', hint: 'Long up-curve + short horiz', command: '\\l \\n' },
  { key: 're', label: 'R+E', hint: 'Up-curve + small circle', command: '\\r \\e' },
  { key: 'le', label: 'L+E', hint: 'Long up-curve + small circle', command: '\\l \\e' },
  { key: 'ps', label: 'P+S', hint: 'Left curve + tick', command: '\\p \\s' },
  { key: 'fs', label: 'F+S', hint: 'Right curve + tick', command: '\\f \\s' },
  { key: 'ts', label: 'T+S', hint: 'Down + tick', command: '\\t \\s' },
  { key: 'ns', label: 'N+S', hint: 'Short horiz + tick', command: '\\n \\s' }
];
