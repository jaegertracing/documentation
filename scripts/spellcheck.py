from markdown_it import MarkdownIt
from spellchecker import SpellChecker
import glob
import re

spell = SpellChecker()

misspelled_words = set()

def check_spelling(filename):
    with open(filename, 'r') as f:
        text = f.read()

    with open('utils/dictionary.txt', 'r') as f:
        words_to_ignore = [line.strip() for line in f]

    spell.word_frequency.load_words(words_to_ignore)

    md = MarkdownIt()
    tokens = md.parse(text)

    words = []
    for token in tokens:
        if token.type not in ["inline_code", "fence"]:
            words.extend(re.findall(r'\b\w+\b', token.content))

    misspelled = spell.unknown(words)
    for word in misspelled:
        print(f'Misspelled word in {filename}: {word}')
        misspelled_words.add(word)

print('Checking spelling...')
for filename in glob.glob('../content/**/*.md', recursive=True):
    check_spelling(filename)

print(f'Found {len(misspelled_words)} misspelled words')