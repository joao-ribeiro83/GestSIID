-- PKG_DOCUMENTOS (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PKG_DOCUMENTOS
AS

--*
--* DESCRIC?O : Insere na lista de parametros um parametro do tipo CHAR/VARCHAR.
--*
--* PARAMETROS: P_NOMEPAR - nome do parametro do documento.
--*             P_VAL     - valor a atribuir ao parametro.
--*
--* NOTA      :
--*
  PROCEDURE SET_PARAMETRO_STRING   (P_NOMEPAR IN VARCHAR2, P_VAL IN VARCHAR2);
--*
--* DESCRIC?O : Insere na lista de parametros um parametro do tipo DATA.
--*
--* PARAMETROS: P_NOMEPAR - nome do parametro do documento.
--*             P_VAL     - valor a atribuir ao parametro.
--*
--* NOTA      :
--*
  PROCEDURE SET_PARAMETRO_DATA   (P_NOMEPAR IN VARCHAR2, P_VAL IN DATE);
--*
--* DESCRIC?O : Insere na lista de parametros um parametro do tipo numerico.
--*
--* PARAMETROS: P_NOMEPAR - nome do parametro do documento.
--*             P_VAL     - valor a atribuir ao parametro.
--*
--* NOTA      :
--*
  PROCEDURE SET_PARAMETRO_NUMERO (P_NOMEPAR IN VARCHAR2, P_VAL IN NUMBER);

--*
--* DESCRIC?O : Envia pedido de execuc?o de um documento ao servidor mas n?o o imprime.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--* NOTA      : Apos a sua execuc?o, limpa a lista de parametros definida.
--*
  PROCEDURE EXECUTA (P_NOMEDOC IN VARCHAR2);

--*
--* DESCRIC?O : Envia pedido de execuc?o e posterior impress?o de um documento ao servidor.
--*
--* PARAMETROS: P_NOMEDOC Nome do documento registado no sistema de impress?o de documentos.
--*
--* NOTA      : Apos a sua execuc?o, limpa a lista de parametros definida.
--*

  procedure gera_lote(p_tipo in number, p_descricao in varchar2, p_list_documentos in varchar2);

  function processa_lote(p_tipo in number, p_descricao in varchar2, p_list_documentos in varchar2) return number;

  procedure add_to_lote(p_documento_id number, p_lote_id number, p_ordem_lote number default null);

  procedure imprime_lote(p_lote_id in number);

  function CHECK_DOCUMENTO(P_MODELO_ID IN VARCHAR2, P_FILTER IN VARCHAR2 DEFAULT NULL)  return number;

  function ALTER_DOCUMENTO(P_MODELO_ID IN VARCHAR2,P_ID IN NUMBER) return number;

  FUNCTION GET_ID_EXECUCAO RETURN NUMBER;

--*
--* DESCRIC?O : Submete um pedido de impress?o para um documento ja gerado.
--*
--* PARAMETROS: P_DOCID   Identificador do documento na tabela SVR_DOCUMENTOS.
--*
  PROCEDURE IMPRIME  ( P_DOCID IN NUMBER );

  PROCEDURE IMPRIME (P_NOMEDOC IN VARCHAR2);

END PKG_DOCUMENTOS;


-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_DOCUMENTOS wrapped
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
2f
2 :e:
1PACKAGE:
1BODY:
1PKG_DOCUMENTOS:
1SET_PARAMETRO_STRING:
1P_NOMEPAR:
1VARCHAR2:
1P_VAL:
1PKG_DOCUMENTOS_SVR:
1SET_PARAMETRO_NUMERO:
1NUMBER:
1SET_PARAMETRO_DATA:
1DATE:
1BACKGROUND:
1P_NOMEDOC:
1V_USER:
130:
1USERNAME:
1USER_USERS:
1_USER:
1EXECUTA:
1REEXECUTA:
1FUNCTION:
1GET_ID_EXECUCAO:
1RETURN:
1GERA_LOTE:
1P_TIPO:
1P_DESCRICAO:
1P_LIST_DOCUMENTOS:
1PROCESSA_LOTE:
1ADD_TO_LOTE:
1P_DOCUMENTO_ID:
1P_LOTE_ID:
1P_ORDEM_LOTE:
1IMPRIME_LOTE:
1CHECK_DOCUMENTO:
1P_MODELO_ID:
1P_FILTER:
1ALTER_DOCUMENTO:
1P_ID:
1IMPRIME:
1P_DOCID:
1L_AMBIENTE:
1L_USUARIO:
1DECODE:
1USER:
1ADMINISTRADOR:
1REIMPRIME:
0

0
0
251
2
0 a0 1d a0 97 9a 8f a0
b0 3d 8f a0 b0 3d b4 55
6a :2 a0 6b :2 a0 a5 57 b7 a4
b1 11 68 4f 9a 8f a0 b0
3d 8f a0 b0 3d b4 55 6a
:2 a0 6b :2 a0 a5 57 b7 a4 b1
11 68 4f 9a 8f a0 b0 3d
8f a0 b0 3d b4 55 6a :2 a0
6b :2 a0 a5 57 b7 a4 b1 11
68 4f 9a 8f a0 b0 3d b4
a3 55 6a a0 51 a5 1c 81
b0 a0 ac :2 a0 b2 ee ac e5
d0 b2 e9 :2 a0 6b 6e a0 a5
57 :2 a0 6b a0 a5 57 b7 a4
b1 11 68 4f 9a 8f a0 b0
3d b4 a3 55 6a a0 51 a5
1c 81 b0 a0 ac :2 a0 b2 ee
ac e5 d0 b2 e9 :2 a0 6b 6e
a0 a5 57 :2 a0 6b a0 a5 57
b7 a4 b1 11 68 4f 9a 8f
a0 b0 3d b4 a3 55 6a a0
51 a5 1c 81 b0 a0 ac :2 a0
b2 ee ac e5 d0 b2 e9 :2 a0
6b 6e a0 a5 57 :2 a0 6b a0
a5 57 b7 a4 b1 11 68 4f
a0 8d a0 b4 a0 2c 6a :3 a0
6b 65 b7 a4 b1 11 68 4f
9a 8f a0 b0 3d 8f a0 b0
3d 8f a0 b0 3d b4 55 6a
:2 a0 6b :3 a0 a5 57 b7 a4 b1
11 68 4f a0 8d 8f a0 b0
3d 8f a0 b0 3d 8f a0 b0
3d b4 :2 a0 2c 6a :3 a0 6b :3 a0
a5 b 65 b7 a4 b1 11 68
4f 9a 8f a0 b0 3d 8f a0
b0 3d 8f a0 4d b0 3d b4
55 6a :2 a0 6b :3 a0 a5 57 b7
a4 b1 11 68 4f 9a 8f a0
b0 3d b4 55 6a :2 a0 6b a0
a5 57 b7 a4 b1 11 68 4f
a0 8d 8f a0 b0 3d 8f a0
4d b0 3d b4 :2 a0 2c 6a :3 a0
6b :2 a0 a5 b 65 b7 a4 b1
11 68 4f a0 8d 8f a0 b0
3d 8f a0 b0 3d b4 :2 a0 a3
2c 6a a0 51 a5 1c 81 b0
a0 ac :2 a0 b2 ee ac e5 d0
b2 e9 :3 a0 6b :3 a0 a5 b 65
b7 a4 b1 11 68 4f 9a 8f
a0 b0 3d b4 a3 55 6a a0
51 a5 1c 81 b0 a0 ac :2 a0
b2 ee ac e5 d0 b2 e9 :2 a0
6b 6e a0 a5 57 :2 a0 6b a0
a5 57 b7 a4 b1 11 68 4f
9a 8f a0 b0 3d b4 a3 55
6a a0 51 a5 1c 81 b0 a3
a0 51 a5 1c 81 b0 a0 ac
:2 a0 b2 ee ac e5 d0 b2 e9
:3 a0 6e a0 a5 b ac :2 a0 b2
ee ac e5 d0 b2 e9 :2 a0 6b
:3 a0 a5 57 b7 a4 b1 11 68
4f 9a 8f a0 b0 3d b4 a3
55 6a a0 51 a5 1c 81 b0
a0 ac :2 a0 b2 ee ac e5 d0
b2 e9 :2 a0 6b 6e a0 a5 57
:2 a0 6b a0 a5 57 b7 a4 b1
11 68 4f b1 b7 a4 11 a0
b1 56 4f 17 b5
251
2
0 3 7 8 c 16 2f 2b
2a 37 44 40 27 4c 3f 51
55 59 5d 3c 61 65 69 6a
6f 71 75 77 83 87 89 a2
9e 9d aa b7 b3 9a bf b2
c4 c8 cc d0 af d4 d8 dc
dd e2 e4 e8 ea f6 fa fc
115 111 110 11d 12a 126 10d 132
125 137 13b 13f 143 122 147 14b
14f 150 155 157 15b 15d 169 16d
16f 188 184 183 190 180 1b5 199
19d 1a1 1a5 1a8 1a9 1b1 198 1bc
195 1c0 1c4 1c8 1c9 1d0 1d1 1d7
1db 1dc 1e1 1e5 1e9 1ec 1f1 1f5
1f6 1fb 1ff 203 206 20a 20b 210
212 216 218 224 228 22a 243 23f
23e 24b 23b 270 254 258 25c 260
263 264 26c 253 277 250 27b 27f
283 284 28b 28c 292 296 297 29c
2a0 2a4 2a7 2ac 2b0 2b1 2b6 2ba
2be 2c1 2c5 2c6 2cb 2cd 2d1 2d3
2df 2e3 2e5 2fe 2fa 2f9 306 2f6
32b 30f 313 317 31b 31e 31f 327
30e 332 30b 336 33a 33e 33f 346
347 34d 351 352 357 35b 35f 362
367 36b 36c 371 375 379 37c 380
381 386 388 38c 38e 39a 39e 3a0
3a4 3b5 3b9 3ba 3be 3c2 3c6 3ca
3ce 3d2 3d5 3d9 3db 3df 3e1 3ed
3f1 3f3 40c 408 407 414 421 41d
404 429 432 42e 41c 43a 419 43f
443 447 44b 44f 452 456 45a 45e
45f 464 466 46a 46c 478 47c 47e
482 49b 497 496 4a3 4b0 4ac 493
4b8 4c1 4bd 4ab 4c9 4a8 4ce 4d2
4d6 4da 4de 4e2 4e6 4ea 4ed 4f1
4f5 4f9 4fa 4fc 500 502 506 508
514 518 51a 533 52f 52e 53b 548
544 52b 550 55a 555 559 543 562
540 567 56b 56f 573 577 57a 57e
582 586 587 58c 58e 592 594 5a0
5a4 5a6 5bf 5bb 5ba 5c7 5b7 5cc
5d0 5d4 5d8 5dc 5df 5e3 5e4 5e9
5eb 5ef 5f1 5fd 601 603 607 620
61c 61b 628 635 631 618 630 63d
62d 642 646 64a 64e 652 656 65a
65e 661 665 669 66a 66c 670 672
676 678 684 688 68a 68e 6a7 6a3
6a2 6af 6bc 6b8 69f 6c4 6b7 6c9
6cd 6ee 6d5 6d9 6dd 6b4 6e1 6e2
6ea 6d4 6f5 6d1 6f9 6fd 701 702
709 70a 710 714 715 71a 71e 722
726 729 72d 731 735 736 738 73c
73e 742 744 750 754 756 76f 76b
76a 777 767 79c 780 784 788 78c
78f 790 798 77f 7a3 77c 7a7 7ab
7af 7b0 7b7 7b8 7be 7c2 7c3 7c8
7cc 7d0 7d3 7d8 7dc 7dd 7e2 7e6
7ea 7ed 7f1 7f2 7f7 7f9 7fd 7ff
80b 80f 811 82a 826 825 832 822
857 83b 83f 843 847 84a 84b 853
83a 873 862 837 866 867 86f 861
87a 85e 87e 882 886 887 88e 88f
895 899 89a 89f 8a3 8a7 8ab 8b0
8b4 8b5 8b7 8b8 8bc 8c0 8c1 8c8
8c9 8cf 8d3 8d4 8d9 8dd 8e1 8e4
8e8 8ec 8f0 8f1 8f6 8f8 8fc 8fe
90a 90e 910 929 925 924 931 921
956 93a 93e 942 946 949 94a 952
939 95d 936 961 965 969 96a 971
972 978 97c 97d 982 986 98a 98d
992 996 997 99c 9a0 9a4 9a7 9ab
9ac 9b1 9b3 9b7 9b9 9c5 9c9 9cb
9cd 9cf 9d3 9df 9e3 9e5 9e8 9ea
9f3
251
2
0 :2 1 9 e d 22 2f :2 22
39 42 :2 39 21 :2 3 5 :2 18 2d
37 :2 5 :6 3 d 22 2f :2 22 39
42 :2 39 21 :2 3 5 :2 18 2d 37
:2 5 :6 3 d 20 2d :2 20 37 40
:2 37 1f :2 3 5 :2 18 2b 35 :2 5
:6 3 d 19 26 :2 19 18 5 :2 3
c 16 15 :2 c 5 :4 c 5 c
:6 5 :2 18 2d 35 :3 5 :2 18 20 :2 5
:6 3 d 16 23 :2 16 15 5 :2 3
c 16 15 :2 c 5 :4 c 5 c
:6 5 :2 18 2d 35 :3 5 :2 18 20 :2 5
:6 3 d 18 25 :2 18 17 5 :2 3
c 16 15 :2 c 5 :4 c 5 c
:6 5 :2 18 2d 35 :3 5 :2 18 22 :2 5
:7 3 c 1c 0 23 :2 3 5 c
:2 1f 5 :6 3 d 17 21 :2 17 29
38 :2 29 42 57 :2 42 16 :2 3 5
:2 18 22 29 35 :2 5 :7 3 c 1a
24 :2 1a 2c 3b :2 2c 45 5a :2 45
19 64 6b :2 3 5 c :2 1f 2d
34 40 :2 c 5 :6 3 d 19 28
:2 19 30 3a :2 30 42 4f 5e :2 42
18 :2 3 5 :2 18 24 33 3d :2 5
:6 3 d 1a 27 :2 1a 19 :2 3 5
:2 18 25 :2 5 :7 3 c 1c 2b :2 1c
35 41 53 :2 35 1b 5b 62 :2 3
5 c :2 1f 2f 3b :2 c 5 :7 3
c 1c 2b :2 1c 34 3c :2 34 1b
44 4b 5 :2 3 c 16 15 :2 c
5 :4 c 5 c :6 5 c :2 1f 2f
3b 40 :2 c 5 :6 3 d 16 23
:2 16 15 5 :2 3 c 16 15 :2 c
5 :4 c 5 c :6 5 :2 18 2d 35
:3 5 :2 18 20 :2 5 :6 3 d 16 21
:2 16 15 5 :2 3 10 1a 19 :2 10
:2 5 10 1a 19 :2 10 5 :4 c 5
c :5 5 c 13 1c 21 31 :5 c
5 c :6 5 :2 18 20 28 32 :2 5
:6 3 d 18 25 :2 18 17 5 :2 3
c 16 15 :2 c 5 :4 c 5 c
:6 5 :2 18 2d 35 :3 5 :2 18 22 :2 5
:a 3 5 :5 1
251
2
0 :4 1 :c 4 :7 6 :2 5 :3 4 7 :c 9
:7 b :2 a :3 9 c :c e :7 11 :2 f :3 e
12 :6 15 16 :2 15 :6 16 :2 18 19 :4 1a
:4 18 :7 1b :6 1c :2 17 :3 15 1d :6 1f 20
:2 1f :6 20 :2 22 23 :4 24 :4 22 :7 25 :6 26
:2 21 :3 1f 27 :6 29 2a :2 29 :6 2a :2 2c
2d :4 2e :4 2c :7 2f :6 30 :2 2b :3 29 31
:3 33 0 :3 33 :5 36 :2 35 :3 33 37 :10 39
:8 3b :2 3a :3 39 3c :13 3e :a 40 :2 3f :3 3e
41 :11 43 :8 45 :2 44 :3 43 46 :8 49 :6 4b
:2 4a :3 49 4c :10 4e :9 50 :2 4f :3 4e 51
:d 54 55 :2 54 :6 55 :2 57 58 :4 59 :4 57
:a 5b :2 56 :3 54 5c :6 5e 5f :2 5e :6 5f
:2 61 62 :4 63 :4 61 :7 65 :6 66 :2 60 :3 5e
67 :6 69 6a :2 69 :6 6a :7 6b :2 6d 6e
:4 6f :4 6d :8 71 72 :4 73 :4 71 :8 75 :2 6c
:3 69 76 :6 78 79 :2 78 :6 79 :2 7b 7c
:4 7d :4 7b :7 7f :6 80 :2 7a :3 78 81 :4 4
83 :5 1
9f5
4
:3 0 1 :4 0 2
:3 0 3 :6 0 1
:2 0 4 :a 0 1c
2 :4 0 5 3c
0 3 6 :3 0
5 :7 0 8 7
:3 0 11 12 0
7 6 :3 0 7
:7 0 c b :3 0
e :2 0 1c 5
f :2 0 8 :3 0
4 :3 0 5 :3 0
7 :3 0 a 13
16 :2 0 18 f
1b :3 0 1b 0
1b 1a 18 19
:6 0 1c 1 0
5 f 1b 24c
:2 0 9 :a 0 35
3 :4 0 14 af
0 12 6 :3 0
5 :7 0 21 20
:3 0 2a 2b 0
16 a :3 0 7
:7 0 25 24 :3 0
27 :2 0 35 1e
28 :2 0 8 :3 0
9 :3 0 5 :3 0
7 :3 0 19 2c
2f :2 0 31 1e
34 :3 0 34 0
34 33 31 32
:6 0 35 1 0
1e 28 34 24c
:2 0 b :a 0 4e
4 :4 0 23 122
0 21 6 :3 0
5 :7 0 3a 39
:3 0 43 44 0
25 c :3 0 7
:7 0 3e 3d :3 0
40 :2 0 4e 37
41 :2 0 8 :3 0
b :3 0 5 :3 0
7 :3 0 28 45
48 :2 0 4a 2d
4d :3 0 4d 0
4d 4c 4a 4b
:6 0 4e 1 0
37 41 4d 24c
:2 0 d :a 0 7b
5 :4 0 32 :2 0
30 6 :3 0 e
:7 0 53 52 :3 0
38 :2 0 36 55
:2 0 7b 50 57
:2 0 6 :3 0 10
:2 0 34 59 5b
:6 0 5e 5c 0
79 f :6 0 11
:3 0 f :3 0 12
:3 0 3a 63 :2 0
65 :4 0 67 68
:5 0 60 64 0
3c 0 66 :2 0
77 8 :3 0 4
:3 0 6a 6b 0
13 :4 0 f :3 0
3e 6c 6f :2 0
77 8 :3 0 14
:3 0 71 72 0
e :3 0 41 73
75 :2 0 77 49
7a :3 0 7a 47
7a 79 77 78
:6 0 7b 1 0
50 57 7a 24c
:2 0 14 :a 0 a8
6 :4 0 4e :2 0
43 6 :3 0 e
:7 0 80 7f :3 0
54 :2 0 52 82
:2 0 a8 7d 84
:2 0 6 :3 0 10
:2 0 50 86 88
:6 0 8b 89 0
a6 f :6 0 11
:3 0 f :3 0 12
:3 0 56 90 :2 0
92 :4 0 94 95
:5 0 8d 91 0
58 0 93 :2 0
a4 8 :3 0 4
:3 0 97 98 0
13 :4 0 f :3 0
5a 99 9c :2 0
a4 8 :3 0 14
:3 0 9e 9f 0
e :3 0 5d a0
a2 :2 0 a4 65
a7 :3 0 a7 63
a7 a6 a4 a5
:6 0 a8 1 0
7d 84 a7 24c
:2 0 15 :a 0 d5
7 :4 0 6a :2 0
5f 6 :3 0 e
:7 0 ad ac :3 0
70 :2 0 6e af
:2 0 d5 aa b1
:2 0 6 :3 0 10
:2 0 6c b3 b5
:6 0 b8 b6 0
d3 f :6 0 11
:3 0 f :3 0 12
:3 0 72 bd :2 0
bf :4 0 c1 c2
:5 0 ba be 0
74 0 c0 :2 0
d1 8 :3 0 4
:3 0 c4 c5 0
13 :4 0 f :3 0
76 c6 c9 :2 0
d1 8 :3 0 15
:3 0 cb cc 0
e :3 0 79 cd
cf :2 0 d1 81
d4 :3 0 d4 7f
d4 d3 d1 d2
:6 0 d5 1 0
aa b1 d4 24c
:2 0 16 :3 0 17
:a 0 e7 8 :4 0
18 :4 0 a :3 0
da db 0 e7
d8 dc :2 0 18
:3 0 8 :3 0 17
:3 0 df e0 0
e1 :2 0 e3 86
e6 :3 0 e6 0
e6 e5 e3 e4
:6 0 e7 1 0
d8 dc e6 24c
:2 0 19 :a 0 105
9 :4 0 8b 419
0 89 a :3 0
1a :7 0 ec eb
:3 0 8f :2 0 8d
6 :3 0 1b :7 0
f0 ef :3 0 6
:3 0 1c :7 0 f4
f3 :3 0 f6 :2 0
105 e9 f7 :2 0
8 :3 0 19 :3 0
f9 fa 0 1a
:3 0 1b :3 0 1c
:3 0 93 fb ff
:2 0 101 99 104
:3 0 104 0 104
103 101 102 :6 0
105 1 0 e9
f7 104 24c :2 0
16 :3 0 1d :a 0
128 a :4 0 9e
4a8 0 9c a
:3 0 1a :7 0 10b
10a :3 0 a2 :2 0
a0 6 :3 0 1b
:7 0 10f 10e :3 0
6 :3 0 1c :7 0
113 112 :3 0 18
:3 0 a :3 0 115
117 0 128 108
118 :2 0 18 :3 0
8 :3 0 1d :3 0
11b 11c 0 1a
:3 0 1b :3 0 1c
:3 0 a6 11d 121
122 :2 0 124 ac
127 :3 0 127 0
127 126 124 125
:6 0 128 1 0
108 118 127 24c
:2 0 1e :a 0 147
b :4 0 b1 540
0 af a :3 0
1f :7 0 12d 12c
:3 0 b5 :2 0 b3
a :3 0 20 :7 0
131 130 :3 0 a
:4 0 21 :7 0 136
134 135 :2 0 138
:2 0 147 12a 139
:2 0 8 :3 0 1e
:3 0 13b 13c 0
1f :3 0 20 :3 0
21 :3 0 b9 13d
141 :2 0 143 bf
146 :3 0 146 0
146 145 143 144
:6 0 147 1 0
12a 139 146 24c
:2 0 22 :a 0 15b
c :4 0 c4 :2 0
c2 a :3 0 20
:7 0 14c 14b :3 0
14e :2 0 15b 149
14f :2 0 8 :3 0
22 :3 0 151 152
0 20 :3 0 c6
153 155 :2 0 157
ca 15a :3 0 15a
0 15a 159 157
158 :6 0 15b 1
0 149 14f 15a
24c :2 0 16 :3 0
23 :a 0 17a d
:7 0 cd 6 :3 0
24 :7 0 161 160
:3 0 d1 :2 0 cf
6 :3 0 25 :7 0
166 164 165 :2 0
18 :3 0 a :3 0
168 16a 0 17a
15e 16b :2 0 18
:3 0 8 :3 0 23
:3 0 16e 16f 0
24 :3 0 25 :3 0
d4 170 173 174
:2 0 176 d9 179
:3 0 179 0 179
178 176 177 :6 0
17a 1 0 15e
16b 179 24c :2 0
16 :3 0 26 :a 0
1ab e :4 0 de
6b4 0 dc 6
:3 0 24 :7 0 180
17f :3 0 10 :2 0
e0 a :3 0 27
:7 0 184 183 :3 0
18 :3 0 a :3 0
e7 :2 0 e5 186
188 0 1ab 17d
18a :2 0 6 :3 0
e3 18c 18e :6 0
191 18f 0 1a9
f :6 0 11 :3 0
f :3 0 12 :3 0
e9 196 :2 0 198
:4 0 19a 19b :5 0
193 197 0 eb
0 199 :2 0 1a7
18 :3 0 8 :3 0
26 :3 0 19e 19f
0 24 :3 0 27
:3 0 f :3 0 ed
1a0 1a4 1a5 :2 0
1a7 f6 1aa :3 0
1aa f4 1aa 1a9
1a7 1a8 :6 0 1ab
1 0 17d 18a
1aa 24c :2 0 28
:a 0 1d8 f :4 0
fa :2 0 f1 6
:3 0 e :7 0 1b0
1af :3 0 100 :2 0
fe 1b2 :2 0 1d8
1ad 1b4 :2 0 6
:3 0 10 :2 0 fc
1b6 1b8 :6 0 1bb
1b9 0 1d6 f
:6 0 11 :3 0 f
:3 0 12 :3 0 102
1c0 :2 0 1c2 :4 0
1c4 1c5 :5 0 1bd
1c1 0 104 0
1c3 :2 0 1d4 8
:3 0 4 :3 0 1c7
1c8 0 13 :4 0
f :3 0 106 1c9
1cc :2 0 1d4 8
:3 0 28 :3 0 1ce
1cf 0 e :3 0
109 1d0 1d2 :2 0
1d4 111 1d7 :3 0
1d7 10f 1d7 1d6
1d4 1d5 :6 0 1d8
1 0 1ad 1b4
1d7 24c :2 0 28
:a 0 218 10 :4 0
116 :2 0 10b a
:3 0 29 :7 0 1dd
1dc :3 0 10 :2 0
11a 1df :2 0 218
1da 1e1 :2 0 6
:3 0 10 :2 0 118
1e3 1e5 :6 0 1e8
1e6 0 216 2a
:6 0 120 :2 0 11e
6 :3 0 11c 1ea
1ec :6 0 1ef 1ed
0 216 2b :6 0
11 :3 0 2a :3 0
12 :3 0 122 1f4
:2 0 1f6 :4 0 1f8
1f9 :5 0 1f1 1f5
0 124 0 1f7
:2 0 214 2c :3 0
11 :3 0 2d :3 0
2e :4 0 2d :3 0
126 1fb 200 12b
2b :3 0 12 :3 0
12d 205 :2 0 207
:4 0 209 20a :5 0
202 206 0 12f
0 208 :2 0 214
8 :3 0 28 :3 0
20c 20d 0 29
:3 0 2b :3 0 2a
:3 0 131 20e 212
:2 0 214 13c 217
:3 0 217 139 217
216 214 215 :6 0
218 1 0 1da
1e1 217 24c :2 0
2f :a 0 245 11
:4 0 141 :2 0 135
6 :3 0 e :7 0
21d 21c :3 0 147
:2 0 145 21f :2 0
245 21a 221 :2 0
6 :3 0 10 :2 0
143 223 225 :6 0
228 226 0 243
f :6 0 11 :3 0
f :3 0 12 :3 0
149 22d :2 0 22f
:4 0 231 232 :5 0
22a 22e 0 14b
0 230 :2 0 241
8 :3 0 4 :3 0
234 235 0 13
:4 0 f :3 0 14d
236 239 :2 0 241
8 :3 0 2f :3 0
23b 23c 0 e
:3 0 150 23d 23f
:2 0 241 158 244
:3 0 244 156 244
243 241 242 :6 0
245 1 0 21a
221 244 24c :3 0
24a 0 24a :3 0
24a 24c 248 249
:6 0 24d :2 0 3
:3 0 15d 0 4
24a 24f :2 0 2
24d 250 :8 0
16e
4
:2 0 152 1 6
1 a 2 9
d 2 14 15
1 17 2 17
1d 1 1f 1
23 2 22 26
2 2d 2e 1
30 2 30 36
1 38 1 3c
2 3b 3f 2
46 47 1 49
2 49 4f 1
51 1 54 1
5a 1 56 1
5f 1 62 1
61 2 6d 6e
1 74 1 7e
0 76 1 5d
4 69 70 76
7c 1 81 1
87 1 83 1
8c 1 8f 1
8e 2 9a 9b
1 a1 1 ab
0 a3 1 8a
4 96 9d a3
a9 1 ae 1
b4 1 b0 1
b9 1 bc 1
bb 2 c7 c8
1 ce 1 e2
0 d0 1 b7
4 c3 ca d0
d6 2 e2 e8
1 ea 1 ee
1 f2 3 ed
f1 f5 3 fc
fd fe 1 100
2 100 106 1
109 1 10d 1
111 3 10c 110
114 3 11e 11f
120 1 123 2
123 129 1 12b
1 12f 1 133
3 12e 132 137
3 13e 13f 140
1 142 2 142
148 1 14a 1
14d 1 154 1
156 2 156 15c
1 15f 1 163
2 162 167 2
171 172 1 175
2 175 17b 1
17e 1 182 2
181 185 1 18d
1 189 1 192
1 195 1 194
3 1a1 1a2 1a3
1 1ae 0 1
190 3 19c 1a6
1ac 1 1b1 1
1b7 1 1b3 1
1bc 1 1bf 1
1be 2 1ca 1cb
1 1d1 1 1db
0 1d3 1 1ba
4 1c6 1cd 1d3
1d9 1 1de 1
1e4 1 1e0 1
1eb 1 1e9 1
1f0 1 1f3 1
1f2 4 1fc 1fd
1fe 1ff 1 201
1 204 1 203
3 20f 210 211
1 21b 0 213
2 1e7 1ee 4
1fa 20b 213 219
1 21e 1 224
1 220 1 229
1 22c 1 22b
2 237 238 1
23e 4 :2 0 240
1 227 4 233
23a 240 246 10
1c 35 4e 7b
a8 d5 e7 105
128 147 15b 17a
1ab 1d8 218 245

1
4
0
24f
0
1
14
11
33
0 1 1 1 1 1 1 1
1 1 1 1 1 1 1 1
1 0 0 0
15e 1 d
220 11 0
1b3 f 0
189 e 0
b0 7 0
83 6 0
56 5 0
17d 1 e
21a 1 11
5 1 2
e9 1 9
37 1 4
14a c 0
12f b 0
133 b 0
d8 1 8
1e 1 3
10d a 0
ee 9 0
12a 1 b
182 e 0
21b 11 0
1ae f 0
ab 7 0
7e 6 0
51 5 0
12b b 0
1e9 10 0
111 a 0
f2 9 0
7d 1 6
1e0 10 0
1db 10 0
149 1 c
aa 1 7
4 0 1
38 4 0
1f 3 0
6 2 0
108 1 a
109 a 0
ea 9 0
17e e 0
15f d 0
1da 1 10
1ad 1 f
50 1 5
3c 4 0
23 3 0
a 2 0
163 d 0
0


