"""Pruebas de planear_borrados (18/10): la copia borra lo que se borró en Supabase, 30 días después.

    python -m unittest discover -s copias
"""

import datetime as dt
import unittest

from copiar import planear_borrados

HOY = dt.date(2026, 11, 20)


class PlanearBorrados(unittest.TestCase):
    def test_lo_que_sigue_en_supabase_no_se_toca(self):
        anotados, borrar, recien = planear_borrados({"audios/a.ogg", "audios/a.ogg@2026-10-01"}, {"audios/a.ogg"}, {}, HOY)
        self.assertEqual((anotados, borrar, recien), ({}, [], []))

    def test_lo_que_falta_hoy_se_anota_y_no_se_borra(self):
        anotados, borrar, recien = planear_borrados({"audios/n.ogg"}, set(), {}, HOY)
        self.assertEqual(anotados, {"audios/n.ogg": "2026-11-20"})
        self.assertEqual(borrar, [])
        self.assertEqual(recien, ["audios/n.ogg"])

    def test_a_los_30_dias_se_borra_con_sus_versiones(self):
        copiados = {"audios/b.ogg", "audios/b.ogg@2026-10-15", "audios/c.ogg"}
        anotados, borrar, _ = planear_borrados(copiados, set(), {"audios/b.ogg": "2026-10-21", "audios/c.ogg": "2026-11-10"}, HOY)
        self.assertEqual(borrar, ["audios/b.ogg", "audios/b.ogg@2026-10-15"])
        self.assertEqual(anotados, {"audios/c.ogg": "2026-11-10"})

    def test_si_vuelve_a_aparecer_deja_de_estar_anotado(self):
        anotados, borrar, _ = planear_borrados({"audios/c.ogg"}, {"audios/c.ogg"}, {"audios/c.ogg": "2026-10-01"}, HOY)
        self.assertEqual((anotados, borrar), ({}, []))

    def test_el_archivo_de_control_nunca_se_borra(self):
        _, borrar, recien = planear_borrados({"_control/borrados.json"}, set(), {}, HOY)
        self.assertEqual((borrar, recien), ([], []))


if __name__ == "__main__":
    unittest.main()
