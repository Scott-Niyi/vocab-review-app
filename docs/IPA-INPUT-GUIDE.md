# IPA Input Guide

## Overview

The vocabulary review app now includes an intelligent IPA (International Phonetic Alphabet) input system and natural pronunciation respelling support.

## Features

### 1. Natural Pronunciation (Respelling)

A simplified pronunciation format that's easier to read than IPA:
- Use **CAPS** for stressed syllables
- Use hyphens to separate syllables
- Examples:
  - "pronunciation" → `pruh-nun-see-AY-shuhn`
  - "schedule" → `SKEJ-ool` or `SHED-yool`
  - "intra-beltway" → `in-truh-BELT-way`

### 2. IPA Input with Auto-completion

Type shortcuts and press **Tab** to insert IPA symbols automatically.

#### Vowels

| Shortcut | Symbol | Description | Example Word |
|----------|--------|-------------|--------------|
| `ae` | æ | ash | cat |
| `@` or `schwa` | ə | schwa | about |
| `A` | ɑ | open back | father |
| `O` | ɔ | open-mid back | thought |
| `V` | ʌ | caret | cup |
| `U` | ʊ | upsilon | book |
| `I` | ɪ | small capital I | bit |
| `E` | ɛ | epsilon | bed |
| `3` | ɜ | open-mid central | bird |

#### Consonants

| Shortcut | Symbol | Description | Example Word |
|----------|--------|-------------|--------------|
| `S` | ʃ | esh | ship |
| `Z` | ʒ | ezh | measure |
| `T` | θ | theta | think |
| `D` | ð | eth | this |
| `N` | ŋ | eng | sing |

#### Stress & Length Markers

| Shortcut | Symbol | Description |
|----------|--------|-------------|
| `'` or `"` | ˈ | primary stress (before syllable) |
| `,` | ˌ | secondary stress (before syllable) |
| `:` | ː | long vowel (after vowel) |

## Usage Examples

### Example 1: "bulk"
1. Type: `'bVlk`
2. When you type `V`, a suggestion appears showing `ʌ`
3. Press **Tab** to insert `ʌ`
4. Result: `ˈbʌlk`
5. Natural respelling: `BULK`

### Example 2: "pronunciation"
1. Type: `pr@,nVnsi'eiS@n`
2. Press **Tab** after each shortcut
3. Result: `prəˌnʌnsiˈeɪʃən`
4. Natural respelling: `pruh-nun-see-AY-shuhn`

### Example 3: "intra-beltway"
1. Type: `,Intr@'bEltwei`
2. Press **Tab** after each shortcut
3. Result: `ˌɪntrəˈbɛltweɪ`
4. Natural respelling: `in-truh-BELT-way`

## UI Features

### Auto-suggestion Popup
- Appears automatically when you type a recognized shortcut
- Shows:
  - The IPA symbol (large)
  - Description (e.g., "ash (cat)")
  - "Press Tab to insert" hint
- Disappears after Tab or when you continue typing

### Quick Reference Panel
- Always visible below the input field
- Shows all available shortcuts organized by category:
  - Vowels
  - Consonants
  - Stress & Length
- Each entry shows: `shortcut` → symbol (example)

## Tips

1. **Start with stress marks**: Type `'` or `,` before the syllable
2. **Use capital letters**: For special consonants (S, Z, T, D, N)
3. **Tab is your friend**: Press Tab whenever you see a suggestion
4. **Mix and match**: You can type regular letters and shortcuts together
5. **Check the reference**: The quick reference panel is always available

## Comparison: IPA vs Natural Respelling

| Word | IPA | Natural Respelling |
|------|-----|-------------------|
| bulk | bʌlk | BULK |
| tackle | ˈtækəl | TAK-uhl |
| pronunciation | prəˌnʌnsiˈeɪʃən | pruh-nun-see-AY-shuhn |
| schedule | ˈskedʒuːl | SKEJ-ool |
| intra-beltway | ˌɪntrəˈbɛltweɪ | in-truh-BELT-way |

## Benefits

### IPA (International Phonetic Alphabet)
- ✅ Precise and unambiguous
- ✅ Internationally recognized standard
- ✅ Used in professional dictionaries
- ❌ Requires learning special symbols
- ❌ Can be intimidating for beginners

### Natural Respelling
- ✅ Easy to read and understand
- ✅ No special symbols needed
- ✅ Intuitive stress indication (CAPS)
- ✅ Great for quick reference
- ❌ Less precise than IPA
- ❌ May vary by accent/dialect

**Best Practice**: Use both! IPA for precision, respelling for quick reading.
