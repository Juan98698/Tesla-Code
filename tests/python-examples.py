"""Comprueba los ejemplos Python publicados en directorios temporales, sin datos del usuario."""
from contextlib import redirect_stdout
from html.parser import HTMLParser
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
import builtins
import json
import os
import subprocess
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


class CodeBlocks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_code = False
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        if tag == 'pre':
            self.in_code = True
            self.blocks.append('')

    def handle_endtag(self, tag):
        if tag == 'pre':
            self.in_code = False

    def handle_data(self, data):
        if self.in_code:
            self.blocks[-1] += data


EXAMPLES = {
    'primer-programa-python': 'Hola\n21\n',
    'decisiones-y-funciones-python': 'Acceso\n',
    'ciclos-y-entradas-python': 'Inicio: 2\n3\n',
    'valores-vacios-y-validacion': 'Escribe una tarea\n',
    'listas-y-arreglos': '22\n',
    'operaciones-con-listas': '2\npracticar\n',
    'referencias-copias-y-mutabilidad': '3\n',
    'listas-anidadas-y-matrices': '10\n',
    'cadenas-en-profundidad': 'ana\n',
    'diccionarios': 'Sin dato\n21\n',
    'conjuntos-y-tuplas': '2\n',
    'busqueda-y-ordenamiento-basicos': '[2, 7, 9]\nTrue\n',
    'recursion': '6\n',
    'modulos-y-bibliotecas': '9.0\n',
    'archivos-y-formatos-de-datos': '2\n',
    'manejo-de-errores': 'Escribe un entero\n',
    'proyecto-gestor-de-tareas': '',
}

# Cada ejemplo se ejecuta por separado y debe coincidir con el código mostrado.
cases = []
for path in sorted((ROOT / 'content' / 'lessons').glob('*/*.json')):
    content = json.loads(path.read_text())
    parser = CodeBlocks()
    parser.feed(content['html'])
    examples = content.get('examples', [])
    if examples:
        for example in examples:
            assert example['language'] == 'python', f'{path.stem}: falta runner para este lenguaje'
            assert example['code'] in parser.blocks, f'{path.stem}: el ejemplo difiere del mostrado'
            cases.append((path.stem, example['id'], example['code'], example['stdout']))
    elif path.stem in EXAMPLES:
        assert parser.blocks, f'{path.stem}: falta el ejemplo'
        cases.append((path.stem, 'legacy', parser.blocks[0], EXAMPLES[path.stem]))

original_directory = Path.cwd()
original_input = builtins.input
try:
    for lesson, example_id, program, expected in cases:
        output = StringIO()
        with TemporaryDirectory(prefix='teslacode-example-') as directory:
            os.chdir(directory)
            def example_input(prompt=''):
                print(prompt, end='')
                return '2'
            builtins.input = example_input
            namespace = {}
            with redirect_stdout(output):
                exec(compile(program, lesson + '.py', 'exec'), namespace)
            assert output.getvalue() == expected, (lesson, output.getvalue(), expected)
            if lesson == 'implementar-algoritmos-en-python':
                for values, maximum in [([-5, -2, -9], -2), ([4, 9, 2], 9), ([7], 7), ([2, 2], 2)]:
                    trial = program.replace('datos = [-8, -3, -6]', 'datos = ' + repr(values), 1)
                    trial_output = StringIO()
                    with redirect_stdout(trial_output):
                        exec(compile(trial, lesson + '.py', 'exec'), {})
                    assert trial_output.getvalue() == str(maximum) + '\n'
            if lesson == 'funciones-y-recursion-algoritmica':
                assert namespace['factorial'](0) == 1
                assert namespace['factorial'](5) == 120
                assert namespace['doble'](-3) == -6
            if example_id in ['legacy', 'principal'] and lesson == 'proyecto-gestor-de-tareas':
                tasks = []
                assert namespace['agregar'](tasks, '   ') is False
                assert namespace['agregar'](tasks, ' leer ') is True
                assert tasks == [{'texto': 'leer', 'completa': False}]
            if example_id in ['legacy', 'principal'] and lesson == 'proyecto-sistema-de-biblioteca':
                library = namespace['Biblioteca'](['A', 'B'])
                assert library.prestar('missing') is False
                assert library.devolver('A') is False
                assert library.prestar('A') is True
                assert library.prestar('A') is False
                assert library.devolver('A') is True
                assert library.prestar('B') is True
            if example_id in ['legacy', 'principal'] and lesson == 'proyecto-final-integrador':
                Repository, register = namespace['RepositorioJSON'], namespace['registrar']
                repository = Repository('contrato.json')
                assert register(repository, '', 'task') is False
                assert register(repository, 'T', ' ') is False
                assert register(repository, 'T', ' first ') is True
                assert register(repository, 'T', 'replacement') is False
                assert Repository('contrato.json').obtener('T') == 'first'
                with patch.object(Path, 'replace', side_effect=OSError('write failed')):
                    try:
                        register(repository, 'U', 'second')
                        raise AssertionError('El fallo de disco debe propagarse')
                    except OSError:
                        pass
                assert repository.obtener('U') is None
                assert Repository('contrato.json').obtener('U') is None
                for invalid in ['{broken', '[]']:
                    Path('corrupto.json').write_text(invalid)
                    try:
                        Repository('corrupto.json')
                        raise AssertionError('Debe rechazarse el archivo inválido')
                    except (ValueError, json.JSONDecodeError):
                        pass
                    assert Path('corrupto.json').read_text() == invalid
                # Repetir el programa conserva los datos existentes y rechaza duplicados.
                repeated = StringIO()
                with redirect_stdout(repeated):
                    exec(compile(program, lesson + '.py', 'exec'), {})
                assert repeated.getvalue() == 'False\nFalse\nLeer\n'
            os.chdir(original_directory)
    git_examples = 0
    for path in (ROOT / 'content' / 'lessons' / 'fundamentos').glob('*.json'):
        content = json.loads(path.read_text())
        if 'gitExample' not in content:
            continue
        example = content['gitExample']
        parser = CodeBlocks()
        parser.feed(content['html'])
        assert example['script'] in parser.blocks, f'{path.stem}: Git probado difiere del mostrado'
        with TemporaryDirectory(prefix='teslacode-git-example-') as directory:
            prefix = 'git() { command git -c core.hooksPath=/dev/null -c commit.gpgsign=false "$@"; }\n'
            subprocess.run(['bash', '-eu', '-c', prefix + example['script']], cwd=directory, check=True, capture_output=True, text=True)
            branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=directory, text=True).strip()
            count = subprocess.check_output(['git', 'rev-list', '--count', 'HEAD'], cwd=directory, text=True).strip()
            assert branch == example['expectedBranch']
            assert int(count) == example['expectedCommits']
            for name, expected in example['expectedFiles'].items():
                assert (Path(directory) / name).read_text() == expected
            assert subprocess.check_output(['git', 'status', '--porcelain'], cwd=directory, text=True) == ''
            git_examples += 1
    print(f'PASS: {git_examples} ejemplo Git; ramas, fusión, archivos e historial comprobados.')
    print(f'PASS: {len(cases)} ejemplos Python ejecutados; entradas y resultados comprobados.')
finally:
    os.chdir(original_directory)
    builtins.input = original_input
