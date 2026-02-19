import { VocabularyEntry } from '../types/vocabulary';

// Version number - increment this when mockData changes
export const MOCK_DATA_VERSION = 4;

// Sample vocabulary entries from your wordlist.tex with hyperlinks
export const mockVocabulary: VocabularyEntry[] = [
  {
    id: 1,
    word: 'bulk',
    pronunciation: 'bʌlk',
    respelling: 'BULK',
    definitions: [
      {
        partOfSpeech: 'n.',
        text: 'the mass or size of something large',
        subDefinitions: [
          {
            phrase: 'in bulk',
            text: 'in large quantities and generally at reduced price',
          },
        ],
      },
      {
        partOfSpeech: 'v.',
        text: 'to treat a product so that its quantity appears greater than it is',
        subDefinitions: [
          {
            phrase: 'bulk up',
            text: 'to build up flesh and muscle, typically in training for sporting events',
            examples: [
              'But if you want to impress, **bulking up** your brain to master Cantonese or Korean is the sign for the true linguistic Ironman.',
            ],
          },
        ],
      },
    ],
    hyperlinks: [],
    familiarityScore: 30,
    timesReviewed: 5,
    timesCorrect: 2,
  },
  {
    id: 2,
    word: 'tackle',
    pronunciation: 'ˈtækəl',
    respelling: 'TAK-uhl',
    definitions: [
      {
        text: 'to deal with',
      },
    ],
    examples: [
      'This is why, even as they firefight, government must focus on **tackling** the fundamental problems confronting the energy industry.',
    ],
    hyperlinks: [],
    familiarityScore: 65,
    timesReviewed: 8,
    timesCorrect: 6,
  },
  {
    id: 3,
    word: 'fit',
    pronunciation: 'fɪt',
    definitions: [
      {
        text: 'a period of time of strong feeling (see also: [[spasm|spasmodically]])',
      },
    ],
    examples: [
      'He had just killed her in a **fit** of jealous rage.',
    ],
    hyperlinks: [],
    familiarityScore: 45,
    timesReviewed: 6,
    timesCorrect: 3,
  },
  {
    id: 4,
    word: 'drench',
    pronunciation: 'drentʃ',
    definitions: [
      {
        text: 'to make something completely wet',
      },
    ],
    examples: [],
    hyperlinks: [],
    familiarityScore: 80,
    timesReviewed: 10,
    timesCorrect: 9,
  },
  {
    id: 5,
    word: 'spasm',
    pronunciation: 'ˈspæzəm',
    definitions: [
      {
        text: 'a sudden involuntary muscular contraction or convulsive movement',
      },
    ],
    examples: [
      'As a result, the sector\'s Teslafication drive will be uneven and [[fit|**fitful**]].',
    ],
    hyperlinks: [],
    familiarityScore: 20,
    timesReviewed: 3,
    timesCorrect: 1,
  },
  {
    id: 6,
    word: 'intra-beltway',
    variants: ['inside-the-beltway'],
    pronunciation: 'ˌɪntrəˈbɛltweɪ',
    respelling: 'in-truh-BELT-way',
    definitions: [
      {
        text: 'of or relating to things that occur in Washington, D.C., especially in relation to U.S. national politics',
      },
    ],
    examples: [],
    hyperlinks: [],
    familiarityScore: 0,
    timesReviewed: 0,
    timesCorrect: 0,
  },
  {
    id: 7,
    word: 'fraught with',
    pronunciation: 'frɔːt wɪð',
    respelling: 'FRAWT with',
    definitions: [
      {
        text: 'filled with or likely to result in something undesirable',
        examples: [
          'The privacy of individuals in a digital age is **fraught with** trade-offs.',
        ],
      },
      {
        text: 'causing or affected by anxiety or stress',
        examples: [
          'First, the geopolitics of shrinking the oil industry are **fraught**.',
        ],
      },
    ],
    hyperlinks: [],
    familiarityScore: 0,
    timesReviewed: 0,
    timesCorrect: 0,
  },
];
