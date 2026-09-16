"""Fake minimo de un cliente supabase-py, para testear voz/buzon.py sin red.

Cada `.table(nombre)` arma una cadena encadenable que registra los metodos
llamados (select/update/eq/lt/order/limit) y, al `execute()`, devuelve el
proximo resultado precargado para esa (tabla, operacion) via `responder()`.
Los tests arman que va a "contestar" Supabase y despues revisan que pidio
el codigo mirando `fake.ejecutadas`.
"""

from dataclasses import dataclass


@dataclass
class Resultado:
    data: list[dict]


class FakeBuilder:
    def __init__(self, fake, tabla):
        self._fake = fake
        self.tabla = tabla
        self.operacion = None
        self.llamadas: list[tuple] = []

    def select(self, *campos):
        self.operacion = "select"
        self.llamadas.append(("select", campos))
        return self

    def update(self, valores):
        self.operacion = "update"
        self.llamadas.append(("update", valores))
        return self

    def eq(self, campo, valor):
        self.llamadas.append(("eq", campo, valor))
        return self

    def lt(self, campo, valor):
        self.llamadas.append(("lt", campo, valor))
        return self

    def order(self, campo):
        self.llamadas.append(("order", campo))
        return self

    def limit(self, n):
        self.llamadas.append(("limit", n))
        return self

    def execute(self):
        self._fake.ejecutadas.append(self)
        cola = self._fake.respuestas.get((self.tabla, self.operacion), [])
        datos = cola.pop(0) if cola else []
        return Resultado(data=datos)


class FakeSupabase:
    def __init__(self):
        self.respuestas: dict[tuple, list] = {}
        self.ejecutadas: list[FakeBuilder] = []

    def responder(self, tabla, operacion, datos):
        """Encola `datos` como respuesta para la proxima (tabla, operacion)."""
        self.respuestas.setdefault((tabla, operacion), []).append(datos)

    def table(self, nombre):
        return FakeBuilder(self, nombre)
