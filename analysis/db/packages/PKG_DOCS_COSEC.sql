-- PKG_DOCS_COSEC (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PKG_DOCS_COSEC AS

  TYPE utPARAMS IS TABLE OF VARCHAR2(2000);
  TYPE utFUN_PARAMETERS IS RECORD
    (
       nParams NUMBER,
       PARAM   utPARAMS
    );

  /*  NOME      : FUN_GET_ROLES
   *  OBJECTIVO : FUNCION QUE DEVUELVE EL TIPO DE ROL ASOCIADO,PASANDOLE EL PRODUTO Y EL CODIGO DEL ROL
   *  UTILIZAC?O: EJEMPLO : SELECT PKG_DOCS_COSEC.FUN_GET_ROLES('CDROLTOM',100) FROM DUAL
   *  VERS?O    : 1.0
   *  CRIADO POR: JOSE VIEGAS
   */
  FUNCTION FUN_GET_ROLES (p_rol in varchar2, p_ramo in number) RETURN varchar2;


  /*  NOME      : FUN_EXECUTE_SQL
   *  OBJECTIVO : FUNC?O QUE DEVOLVE O RESULTADO DA EXECUC?O DE UMA QUERY UNICA
   *  EXEMPLO   : PKG_DOCS.COSEC.FUN_EXECUTE_SQL('SELECT COUNT(NMPOLIZA) FROM MPOLIZAS');
   *  VERS?O    : 1.0
   *  CRIADO POR: JOSE VIEGAS
   */
  FUNCTION FUN_EXECUTE_SQL ( P_SQL IN VARCHAR2) RETURN VARCHAR2;

  /*  NOME      : FUN_EXECUTE_FORMULA
   *  OBJECTIVO : FUNC?O QUE DEVOLVE O RESULTADO DA EXECUC?O DE UMA FUNC?O SQL SEM PARAMETROS
   *  EXEMPLO   : PKG_DOCS.COSEC.FUN_EXECUTE_FORMULA('SYSDATE');
   *  VERS?O    : 1.0
   *  CRIADO POR: JOSE VIEGAS
   */
  FUNCTION FUN_EXECUTE_FORMULA ( P_SQL IN VARCHAR2) RETURN VARCHAR2;

  /*  NOME      : FUN_EXECUTE_FUNCION
   *  OBJECTIVO : FUNC?O QUE DEVOLVE O RESULTADO DA EXECUC?O DE UMA FUNC?O COM PARAMETROS
                  SENDO QUE OS PARAMETROS S?O PASSADOS ATRAVES DE UM RECORD.
   *  EXEMPLO   : PKG_DOCS.COSEC.FUN_EXECUTE_FUNCTION('MONTHS_BETWEEN', P_PARMS);
   *  VERS?O    : 1.0
   *  CRIADO POR: JOSE VIEGAS
   */
  FUNCTION FUN_EXECUTE_FUNCTION( P_SQL IN VARCHAR2, P_PARAMS utFUN_PARAMETERS) RETURN VARCHAR2;

  PRAGMA RESTRICT_REFERENCES (FUN_GET_ROLES, WNDS);
  PRAGMA RESTRICT_REFERENCES (FUN_EXECUTE_SQL, WNDS);
  PRAGMA RESTRICT_REFERENCES (FUN_EXECUTE_FORMULA, WNDS);
  PRAGMA RESTRICT_REFERENCES (FUN_EXECUTE_FUNCTION, WNDS);
END PKG_DOCS_COSEC;


-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_DOCS_COSEC wrapped 
0
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
abcd
3
b
8106000
1
4
0 
2b
2 :e:
1PACKAGE:
1BODY:
1PKG_DOCS_COSEC:
1FUNCTION:
1FUN_GET_ROLES:
1P_ROL:
1VARCHAR2:
1P_RAMO:
1NUMBER:
1RETURN:
1RESULT:
12:
1EXECUTE:
1IMMEDIATE:
1 select :
1||:
1 :
1from mparapro :
1where  :
1cdramo = ::p_ramo:
1USING:
1FUN_EXECUTE_FORMULA:
1P_SQL:
12000:
1BEGIN ::RES::=:
1; END;:
1OUT:
1FUN_EXECUTE_FUNCTION:
1P_PARAMS:
1UTFUN_PARAMETERS:
1SSQL:
1NPARAMS:
1=:
10:
1(':
1NIND:
11:
1LOOP:
1>:
1',':
1PARAM:
1'); END;:
1FUN_EXECUTE_SQL:
0
0
0
11c
2
0 a0 1d a0 97 a0 8d 8f
a0 b0 3d 8f a0 b0 3d b4
:2 a0 a3 2c 6a a0 51 a5 1c
81 b0 :2 a0 6e 7e a0 b4 2e
7e 6e b4 2e 7e 6e b4 2e
7e 6e b4 2e 7e 6e b4 2e
:3 a0 112 11e 11a 11d :2 a0 65 b7
a4 a0 b1 11 68 4f a0 8d
8f a0 b0 3d b4 :2 a0 a3 2c
6a a0 51 a5 1c 81 b0 :2 a0
6e 7e a0 b4 2e 7e 6e a0
b4 2e :2 a0 114 11e 11a 11d :2 a0
65 b7 a4 a0 b1 11 68 4f
a0 8d 8f a0 b0 3d 8f a0
b0 3d b4 :2 a0 a3 2c 6a a0
51 a5 1c 81 b0 a3 a0 51
a5 1c 81 b0 a0 6e 7e a0
b4 2e d :2 a0 6b 7e 51 b4
2e :2 a0 7e 6e b4 2e d b7
:2 a0 7e 6e b4 2e d 91 51
:2 a0 6b a0 63 37 a0 7e 51
b4 2e :2 a0 7e 6e b4 2e d
b7 19 3c :2 a0 7e :2 a0 6b a0
a5 b b4 2e d b7 a0 47
:2 a0 7e 6e b4 2e d b7 :2 19
3c :6 a0 114 11e 11a 11d :2 a0 65
b7 a4 a0 b1 11 68 4f a0
8d 8f a0 b0 3d b4 :2 a0 a3
2c 6a a0 51 a5 1c 81 b0
:4 a0 11e 11d :2 a0 65 b7 a4 a0
b1 11 68 4f b1 b7 a4 11
a0 b1 56 4f 17 b5 
11c
2
0 3 7 8 c 16 1a 33
2f 2e 3b 48 44 2b 50 43
55 59 7a 61 65 69 40 6d
6e 76 60 81 85 89 5d 8e
92 93 98 9b a0 a1 a6 a9
ae af b4 b7 bc bd c2 c5
ca cb d0 d4 d8 dc dd e1
e2 e6 ea ee f2 f4 f8 fc
fe 10a 10e 110 114 12d 129 128
135 125 13a 13e 162 146 14a 14e
152 155 156 15e 145 169 16d 171
142 176 17a 17b 180 183 188 18c
18d 192 196 19a 19b 19f 1a0 1a4
1a8 1ac 1b0 1b2 1b6 1ba 1bc 1c8
1cc 1ce 1d2 1eb 1e7 1e6 1f3 200
1fc 1e3 208 1fb 20d 211 232 219
21d 221 1f8 225 226 22e 218 24e
23d 215 241 242 24a 23c 255 259
239 25e 262 263 268 26c 270 274
277 27a 27d 27e 283 287 28b 28e
293 294 299 29d 29f 2a3 2a7 2aa
2af 2b0 2b5 2b9 2bd 2c0 2c4 2c8
2cb 2cf 2d2 2d4 2d8 2db 2de 2df
2e4 2e8 2ec 2ef 2f4 2f5 2fa 2fe
300 304 307 30b 30f 312 316 31a
31d 321 322 324 325 32a 32e 330
334 33b 33f 343 346 34b 34c 351
355 357 35b 35f 362 366 36a 36e
372 376 37a 37b 37f 380 384 388
38c 390 392 396 39a 39c 3a8 3ac
3ae 3b2 3cb 3c7 3c6 3d3 3c3 3d8
3dc 400 3e4 3e8 3ec 3f0 3f3 3f4
3fc 3e3 407 40b 40f 413 417 41b
41f 423 427 3e0 42b 42f 433 435
441 445 447 449 44b 44f 45b 45f
461 464 466 46f 
11c
2
0 :2 1 9 e 3 c 1b 24
:2 1b 2e 38 :2 2e 1a 40 47 5
:2 3 c 15 14 :2 c :2 5 d 17
21 1c :2 17 21 23 :2 17 26 18
:2 17 28 18 :2 17 21 1d :2 17 1d
13 19 13 :4 5 c 5 :2 3 7
:5 3 c 21 2a :2 21 20 34 3b
5 :2 3 c 15 14 :2 c :2 5 d
17 25 27 :2 17 2c 2e 37 :2 17
3d 41 3d :4 5 c 5 :2 3 7
:5 3 c 22 2b :2 22 35 3e :2 35
20 50 57 5 :2 3 c 15 14
:2 c :2 5 c 15 14 :2 c :2 5 d
1b 1d :2 d 5 8 :2 11 19 1b
:2 19 7 f 13 15 :2 f 7 1d
7 f 13 15 :2 f 7 b 13
16 :2 1f 27 13 7 b 10 12
:2 10 a 12 16 18 :2 12 a 14
:3 8 10 15 17 :2 20 26 :2 17 :2 10
8 27 b :2 7 f 13 15 :2 f
7 :5 5 d 17 1c 22 26 22
:4 5 c 5 :2 3 7 :5 3 c 1d
26 :2 1d 1c 30 37 5 :2 3 c
15 14 :2 c :2 5 d 17 22 :3 5
c 5 :2 3 7 :8 3 5 :5 1 
11c
2
0 :4 1 :d 3 5 :2 3 :6 5 :4 7 8
:2 7 :2 8 :2 7 8 9 :2 7 9 a
:2 7 a b :2 7 c :3 d :3 7 :3 e
:2 6 f :3 3 f :9 11 13 :2 11 :6 13
:12 15 :3 16 :2 14 17 :3 11 17 :d 19 1b
:2 19 :6 1b :7 1c :7 1e :7 20 :7 21 20 :7 23
:8 24 :5 25 :7 26 :3 25 :c 28 24 29 24
:7 2a :2 22 :2 20 :a 2d :3 2f :2 1d 31 :3 19
31 :9 34 36 :2 34 :6 36 :6 38 :3 39 :2 37
3a :3 34 3a :4 3 3d :5 1 
471
4
:3 0 1 :4 0 2
:3 0 3 :6 0 1
:2 0 4 :3 0 5
:a 0 41 2 :4 0
5 40 0 3
7 :3 0 6 :7 0
9 8 :3 0 c
:2 0 7 9 :3 0
8 :7 0 d c
:3 0 a :3 0 7
:3 0 10 :2 0 c
f 11 0 41
6 13 :2 0 7
:3 0 a 15 17
:6 0 1a 18 0
3f b :6 0 d
:3 0 e :3 0 f
:4 0 6 :3 0 e
1e 20 :3 0 10
:2 0 11 :4 0 11
22 24 :3 0 10
:2 0 12 :4 0 14
26 28 :3 0 10
:2 0 13 :4 0 17
2a 2c :3 0 10
:2 0 14 :4 0 1a
2e 30 :3 0 b
:3 0 15 :3 0 8
:3 0 34 31 32
37 0 1d 36
:2 0 3c a :3 0
b :3 0 3a :2 0
3c 24 40 :3 0
40 5 :3 0 22
40 3f 3c 3d
:6 0 41 1 0
6 13 40 117
:2 0 4 :3 0 16
:a 0 6f 3 :4 0
28 :2 0 1f 7
:3 0 17 :7 0 47
46 :3 0 a :3 0
7 :3 0 10 :2 0
2c 49 4b 0
6f 44 4d :2 0
7 :3 0 18 :2 0
2a 4f 51 :6 0
54 52 0 6d
b :6 0 d :3 0
e :3 0 19 :4 0
17 :3 0 2e 58
5a :3 0 10 :2 0
1a :4 0 15 :3 0
31 5c 5f :3 0
1b :3 0 b :3 0
62 60 0 65
0 34 64 :2 0
6a a :3 0 b
:3 0 68 :2 0 6a
3b 6e :3 0 6e
16 :3 0 39 6e
6d 6a 6b :6 0
6f 1 0 44
4d 6e 117 :2 0
4 :3 0 1c :a 0
ee 4 :4 0 3f
1f8 0 36 7
:3 0 17 :7 0 75
74 :3 0 18 :2 0
41 1e :3 0 1d
:7 0 79 78 :3 0
a :3 0 7 :3 0
18 :2 0 46 7b
7d 0 ee 72
7f :2 0 7 :3 0
44 81 83 :6 0
86 84 0 ec
b :6 0 10 :2 0
4a 7 :3 0 48
88 8a :6 0 8d
8b 0 ec 1f
:6 0 1f :3 0 19
:4 0 17 :3 0 4c
90 92 :3 0 8e
93 0 e9 1d
:3 0 20 :3 0 95
96 0 21 :2 0
22 :2 0 51 98
9a :3 0 1f :3 0
1f :3 0 10 :2 0
1a :4 0 54 9e
a0 :3 0 9c a1
0 a3 57 da
1f :3 0 1f :3 0
10 :2 0 23 :4 0
59 a6 a8 :3 0
a4 a9 0 d8
24 :3 0 25 :2 0
1d :3 0 20 :3 0
ad ae 0 26
:3 0 ac af 0
ab b1 24 :3 0
27 :2 0 25 :2 0
5e b4 b6 :3 0
1f :3 0 1f :3 0
10 :2 0 28 :4 0
61 ba bc :3 0
b8 bd 0 bf
64 c0 b7 bf
0 c1 66 0
ce 1f :3 0 1f
:3 0 10 :2 0 1d
:3 0 29 :3 0 c5
c6 0 24 :3 0
68 c7 c9 6a
c4 cb :3 0 c2
cc 0 ce 6d
d0 26 :3 0 b2
ce :4 0 d8 1f
:3 0 1f :3 0 10
:2 0 2a :4 0 70
d3 d5 :3 0 d1
d6 0 d8 73
d9 0 d8 0
db 9b a3 0
db 77 0 e9
d :3 0 e :3 0
1f :3 0 15 :3 0
1b :3 0 b :3 0
e1 de 0 e4
0 7a e3 :2 0
e9 a :3 0 b
:3 0 e7 :2 0 e9
84 ed :3 0 ed
1c :3 0 81 ed
ec e9 ea :6 0
ee 1 0 72
7f ed 117 :2 0
4 :3 0 2b :a 0
110 6 :4 0 7c
:2 0 7f 7 :3 0
17 :7 0 f4 f3
:3 0 a :3 0 7
:3 0 93 10f 0
8c f6 f8 0
110 f1 fa :2 0
7 :3 0 18 :2 0
8a fc fe :6 0
101 ff 0 10e
b :6 0 d :3 0
e :3 0 17 :3 0
b :3 0 104 105
:2 0 106 :2 0 10b
a :3 0 b :3 0
109 :2 0 10b :3 0
10f 2b :3 0 91
10f 10e 10b 10c
:6 0 110 1 0
f1 fa 10f 117
:3 0 115 0 115
:3 0 115 117 113
114 :6 0 118 :2 0
3 :3 0 97 0
4 115 11a :2 0
2 118 11b :8 0
9c
4
:2 0 8e 1 7
1 b 2 a
e 1 16 1
12 2 1d 1f
2 21 23 2
25 27 2 29
2b 2 2d 2f
1 35 1 45
0 1 19 3
38 3b 42 1
48 1 50 1
4c 2 57 59
2 5b 5d 1
63 1 73 0
1 53 3 66
69 70 1 77
2 76 7a 1
82 1 7e 1
89 1 87 2
8f 91 1 99
2 97 99 2
9d 9f 1 a2
2 a5 a7 1
b5 2 b3 b5
2 b9 bb 1
be 1 c0 1
c8 2 c3 ca
2 c1 cd 2
d2 d4 3 aa
d0 d7 2 da
d9 1 e2 1
f5 0 1 f2
2 85 8c 5
94 db e5 e8
ef 1 fd 1
f9 3 :2 0 1
100 3 107 10a
111 4 41 6f
ee 110 
1
4
0 
11a
0
1
14
6
11
0 1 1 1 4 1 0 0
0 0 0 0 0 0 0 0
0 0 0 0 
7 2 0
6 1 2
f2 6 0
73 4 0
45 3 0
72 1 4
b 2 0
87 4 0
ab 5 0
4 0 1
f1 1 6
44 1 3
f9 6 0
7e 4 0
4c 3 0
12 2 0
77 4 0
0

