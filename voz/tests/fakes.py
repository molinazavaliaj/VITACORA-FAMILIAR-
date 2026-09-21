"""Fake minimo de un cliente supabase-py, para testear el worker sin red.

Cada `.table(nombre)` arma una cadena encadenable que registra los metodos
llamados (select/update/eq/lt/order/limit) y, al `execute()`, devuelve el
proximo resultado precargado para esa (tabla, operacion) via `responder()`.
Los tests arman que va a "contestar" Supabase y despues revisan que pidio
el codigo mirando `fake.ejecutadas`.

`.storage.from_(bucket)` devuelve un bucket en memoria (un dict por bucket)
con `upload`/`download`/`remove`, que ademas anota cada subida, descarga y
borrado.
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

    def upsert(self, valores):
        """El `upsert` que usa el latido (pisa la fila del servicio)."""
        self.operacion = "upsert"
        self.llamadas.append(("upsert", valores))
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


class FakeBucket:
    def __init__(self, storage, nombre):
        self._storage = storage
        self.nombre = nombre
        self.archivos: dict[str, bytes] = storage.archivos.setdefault(nombre, {})

    def upload(self, path, file, file_options=None):
        datos = file if isinstance(file, bytes) else open(file, "rb").read()
        self.archivos[path] = datos
        self._storage.subidas.append((self.nombre, path, file_options))
        return {"path": path}

    def download(self, path, query_params=None):
        self._storage.descargas.append((self.nombre, path))
        if query_params:
            self._storage.parametros_descarga.append((self.nombre, path, dict(query_params)))
        return self.archivos[path]

    def list(self, ruta=""):
        """Los nombres que hay en `ruta` (o las carpetas de la raíz si no se pasa).

        Solo lo que usa el pedido de frases (`narradores_con_pedido`): mira la
        raíz del bucket y la carpeta `paquete` de cada narrador. El cliente real
        devuelve objetos con `.name`.
        """
        prefijo = f"{ruta}/" if ruta else ""
        nombres = []
        for path in self.archivos:
            if not path.startswith(prefijo):
                continue
            nombre = path[len(prefijo):].split("/")[0]
            if nombre and nombre not in nombres:
                nombres.append(nombre)
        return [{"name": n} for n in nombres]

    def remove(self, paths):
        """Como el real: borrar lo que no está no es error."""
        self._storage.borrados.append((self.nombre, list(paths)))
        return [{"name": p} for p in paths if self.archivos.pop(p, None) is not None]


class FakeStorage:
    def __init__(self):
        self.archivos: dict[str, dict[str, bytes]] = {}
        self.subidas: list[tuple] = []
        self.descargas: list[tuple] = []
        # Las descargas que pidieron algo mas que la ruta (el cache-buster de
        # `descargar_fresco`): (bucket, ruta, parametros de consulta).
        self.parametros_descarga: list[tuple] = []
        self.borrados: list[tuple] = []

    def from_(self, bucket):
        return FakeBucket(self, bucket)


class FakeSupabase:
    def __init__(self):
        self.respuestas: dict[tuple, list] = {}
        self.ejecutadas: list[FakeBuilder] = []
        self.storage = FakeStorage()

    def responder(self, tabla, operacion, datos):
        """Encola `datos` como respuesta para la proxima (tabla, operacion)."""
        self.respuestas.setdefault((tabla, operacion), []).append(datos)

    def table(self, nombre):
        return FakeBuilder(self, nombre)
