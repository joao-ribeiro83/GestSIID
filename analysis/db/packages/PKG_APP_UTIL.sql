-- PKG_APP_UTIL (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE "PKG_APP_UTIL"
IS
  --* CONSTANTES PROPRIAS QUESTIONAR INFORMACOES SOBRE PACKAGE
  --*
  --* CRIADO POR  : Jose Viegas
  --* DATA CRIACAO: 08-03-2007
  --* OBSERVACAO  : A) ESTA SECCAO DEVE ESTAR NO INICIO DO PACKAGE SEMPRE
  --*               B) SEMPRE QUE FOR EFECTUADA ALGUMA ALTERACAO AO PACKAGE
  --*                  DEVEM SER ACTUALIZADAS AS CONSTANTES DO PACKAGE BODY
  --*                  "VERSAO", "DATA_VERSAO"  "AUTOR_VERSAO".
  --*
  INFO_VERSAO          CONSTANT VARCHAR2(100):='VERSAO';
  INFO_DATA_VERSAO     CONSTANT VARCHAR2(100):='DATA_VERSAO';
  INFO_AUTOR_PACKAGE   CONSTANT VARCHAR2(100):='AUTOR_PACKAGE';
  INFO_AUTOR_VERSAO    CONSTANT VARCHAR2(100):='AUTOR_VERSAO';
  INFO_DATA_PACKAGE    CONSTANT VARCHAR2(100):='DATA_PACKAGE';
  INFO_DATA_INSTALACAO CONSTANT VARCHAR2(100):='DATA_INSTALACAO';
  INFO_OWNER           CONSTANT VARCHAR2(100):='OWNER';

  FUNCTION GET_PACKINFO ( P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE' ) RETURN VARCHAR2;

  Function Lista_Tabapoio(P_Nome_Tabela In Varchar2) Return Tabapoio Pipelined;
  FUNCTION LISTA_TABAPOIO(P_ID_TABELA IN NUMBER) RETURN TABAPOIO PIPELINED;
  Function Num_Tabapoio(P_Nome_Tabela In Varchar2) Return Number;
  FUNCTION FUN_VALOREXTENSO ( nValor NUMBER, cDivisa VARCHAR2) RETURN VARCHAR2;

  PRAGMA RESTRICT_REFERENCES (LISTA_TABAPOIO,WNDS);
  Pragma Restrict_References (Num_Tabapoio,Wnds);
  Pragma Restrict_References (FUN_VALOREXTENSO,Wnds);
  
  
END PKG_APP_UTIL;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY "PKG_APP_UTIL" IS
  /*
  -*
  -* ULTIMAS ALTERACOES AO PACKAGE
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAOO
  -*   ========== ====== =============== ===================================================
  -*   30-03-2006    1.0 Jose Viegas     Criacao do package
  */
  PACOTE         CONSTANT VARCHAR2(100):='PKG_APP_UTIL';
  VERSAO         CONSTANT NUMBER:=1.0;
  DATA_VERSAO    CONSTANT DATE:= TO_DATE('08-03-2007 12:00','DD-MM-YYYY HH24:MI');
  AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='Jose Viegas';
  AUTOR_VERSAO   CONSTANT VARCHAR2(100):='Jose Viegas';

  /*
  -* NOME      : GET_PACKINFO
  -* OBJECTIVO : MANTER INFORMACAO SOBRE VERSAO DO PACKAGE
  -* UTILIZACAO: PKG_CFG_UTIL.GET_PACKINFO ( 'VERSAO' );
  -* AUTOR     : Eng. Jose Viegas
  -* DATA      : 25-11-2004
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== =============== =================================================
  -*   29-06-2005    1.0 JOSE VIEGAS     Adaptacao para o Instanter
  -*/
  FUNCTION GET_PACKINFO ( P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE' ) RETURN VARCHAR2 IS
    AUX VARCHAR2(200);
  BEGIN
    IF P_TIPO_INFO = INFO_VERSAO THEN  /* DEVOLVE VERSAO DO PACKAGE */
      RETURN 'v'||TO_CHAR(VERSAO);
    ELSIF P_TIPO_INFO = INFO_DATA_VERSAO THEN
      RETURN TO_CHAR(DATA_VERSAO,'YYYY-MM-DD HH24:MI');
    ELSIF P_TIPO_INFO = INFO_AUTOR_PACKAGE THEN
      RETURN AUTOR_PACKAGE;
    ELSIF P_TIPO_INFO = INFO_AUTOR_VERSAO THEN
      RETURN AUTOR_VERSAO;
    ELSIF P_TIPO_INFO = INFO_DATA_PACKAGE THEN
      BEGIN
        SELECT
          TO_CHAR(CREATED,'YYYY-MM-DD HH24:MI')
        INTO
          AUX
        FROM
          ALL_OBJECTS
        WHERE
            OBJECT_NAME=PACOTE
        AND OBJECT_TYPE='PACKAGE BODY'
        AND OWNER = (SELECT USERNAME FROM USER_USERS);
        RETURN AUX;
      EXCEPTION
        WHEN OTHERS THEN
         RETURN PACOTE||' v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
      END;
    ELSIF P_TIPO_INFO = INFO_DATA_INSTALACAO THEN
      BEGIN
        SELECT
          TO_CHAR(LAST_DDL_TIME,'YYYY-MM-DD HH24:MI')
        INTO
          AUX
        FROM
          ALL_OBJECTS
        WHERE
            OBJECT_NAME=PACOTE
        AND OBJECT_TYPE='PACKAGE BODY'
        AND OWNER = (SELECT USERNAME FROM USER_USERS);
        RETURN AUX;
      EXCEPTION
        WHEN OTHERS THEN
         RETURN PACOTE||' v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
      END;
    ELSIF P_TIPO_INFO = INFO_OWNER THEN
      SELECT USERNAME INTO AUX FROM USER_USERS;
      RETURN AUX;
    ELSE
      RETURN PACOTE||' v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
    END IF;
  END GET_PACKINFO;

  FUNCTION LISTA_TABAPOIO(P_NOME_TABELA IN VARCHAR2) RETURN TABAPOIO PIPELINED
  IS
    CURSOR selTABELA IS
      SELECT
        LINHAS.*
      FROM
        TTAPVAAT  LINHAS
      , TTAPTABL  TABS
      WHERE
          LINHAS.NMTABLA = TABS.NMTABLA
      AND TABS.CDTABLA   = P_NOME_TABELA;

  BEGIN

    FOR RW IN selTABELA LOOP
      PIPE ROW (LINHA_TABAPOIO(RW.OTCLAVE1
                              ,RW.OTCLAVE2
                              ,RW.OTCLAVE3
                              ,RW.OTCLAVE4
                              ,RW.OTCLAVE5
                              ,RW.FEDESDE
                              ,RW.FEHASTA
                              ,RW.OTVALOR01
                              ,RW.OTVALOR02
                              ,RW.OTVALOR03
                              ,RW.OTVALOR04
                              ,RW.OTVALOR05
                              ,RW.OTVALOR06
                              ,RW.OTVALOR07
                              ,RW.OTVALOR08
                              ,RW.OTVALOR09
                              ,RW.OTVALOR10
                              ,RW.OTVALOR11
                              ,RW.OTVALOR12
                              ,RW.OTVALOR13
                              ,RW.OTVALOR14
                              ,RW.OTVALOR15
                              ,RW.OTVALOR16
                              ,RW.OTVALOR17
                              ,RW.OTVALOR18
                              ,RW.OTVALOR19
                              ,RW.OTVALOR20
                              ,RW.OTVALOR21
                              ,RW.OTVALOR22
                              ,RW.OTVALOR23
                              ,RW.OTVALOR24
                              ,RW.OTVALOR25
                              ,RW.OTVALOR26
                              ));
    END LOOP;

    RETURN;

  END LISTA_TABAPOIO;

  FUNCTION LISTA_TABAPOIO(P_ID_TABELA IN NUMBER) RETURN TABAPOIO PIPELINED
  IS
    CURSOR selTABELA IS
      SELECT
        LINHAS.*
      FROM
        TTAPVAAT  LINHAS
      WHERE
          LINHAS.NMTABLA = P_ID_TABELA;

  BEGIN

    FOR RW IN selTABELA LOOP
      PIPE ROW (LINHA_TABAPOIO(RW.OTCLAVE1
                              ,RW.OTCLAVE2
                              ,RW.OTCLAVE3
                              ,RW.OTCLAVE4
                              ,RW.OTCLAVE5
                              ,RW.FEDESDE
                              ,RW.FEHASTA
                              ,RW.OTVALOR01
                              ,RW.OTVALOR02
                              ,RW.OTVALOR03
                              ,RW.OTVALOR04
                              ,RW.OTVALOR05
                              ,RW.OTVALOR06
                              ,RW.OTVALOR07
                              ,RW.OTVALOR08
                              ,RW.OTVALOR09
                              ,RW.OTVALOR10
                              ,RW.OTVALOR11
                              ,RW.OTVALOR12
                              ,RW.OTVALOR13
                              ,RW.OTVALOR14
                              ,RW.OTVALOR15
                              ,RW.OTVALOR16
                              ,RW.OTVALOR17
                              ,RW.OTVALOR18
                              ,RW.OTVALOR19
                              ,RW.OTVALOR20
                              ,RW.OTVALOR21
                              ,RW.OTVALOR22
                              ,RW.OTVALOR23
                              ,RW.OTVALOR24
                              ,RW.OTVALOR25
                              ,RW.OTVALOR26
                              ));
    END LOOP;

    RETURN;

  END LISTA_TABAPOIO;

   FUNCTION NUM_TABAPOIO(P_NOME_TABELA IN VARCHAR2) RETURN NUMBER
   IS
    AUX_RET NUMBER;

    BEGIN

	  SELECT NMTABLA
	  INTO AUX_RET
	  FROM TTAPTABL
      WHERE CDTABLA=P_NOME_TABELA;

	RETURN AUX_RET;

   END NUM_TABAPOIO;





  /*
  -* NOME      : FUN_VALOREXTENSO
  -* OBJECTIVO : ESCREVER OS NUMEROS POR EXTENSO
  -* UTILIZACAO: PKG_APP_UTIL.FUN_VALOREXTENSO ( 'VERSAO' );
  -* AUTOR     : Eng. Jose Viegas
  -* DATA      : 10-07-2013
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== =============== =================================================
  -*   
  -*/
  
  
FUNCTION FUN_VALOREXTENSO ( nValor NUMBER, cDivisa VARCHAR2) RETURN VARCHAR2
Is
  cTemp         VARCHAR2(15);
  cValorinteiro VARCHAR2(15);
  cValordecimas VARCHAR2(15);
  cEscala       VARCHAR2(4);
   cTexto        VARCHAR2(255);
  cTexto2       VARCHAR2(255);
  cGrupo        VARCHAR2(5);
  cDezenas      VARCHAR2(2);
  cCentenas     VARCHAR2(4);
  cUnidades     VARCHAR2(4);
  cLigacao      VARCHAR2(5);
   cExtenso      VARCHAR2(20);
  anterior      NUMBER;
  NLSCHARS      VARCHAR2(5);
  bSeparador    BOOLEAN:=FALSE;
  cSeparador    VARCHAR2(5);
BEGIN

  anterior      := 0;                    /* ainda n?o foi convertido nada */
   cTemp         := 'Milhões';            /* comeca -se nos milh?es */

  /* VERIFICA QUAL E O CARACTER DECIMAL (SE TIVER) */

  IF INSTR(TO_CHAR(nValor),'.') != 0 THEN
    NLSCHARS:='.';
   ELSIF INSTR(TO_CHAR(nValor),',')!= 0 THEN
    NLSCHARS:=',';
  ELSE
    NLSCHARS:=NULL;
  END IF;

  /* OBTEM PARTE INTEIRA (MAX. CENTENAS DE MILH?ES)*/
  cValorInteiro := LPAD(TO_CHAR(TRUNC(nValor)),9,'0');

  /* OBTEM PARTE DECIMAL */
  cValorDecimas := LPAD(RPAD(SUBSTR(TO_CHAR(nValor),INSTR(TO_CHAR(nValor),NLSCHARS)+1, 2),2,'0'),3,'0'); /* OBTEM PARTE DECIMAL */

  /* PRIMEIRO GRUPO DE CONVERS?O */
   cEscala       := SUBSTR(cValorInteiro,1,3);

  /* INICIALIZA TEXTO DAS UNIDADES */
  cTexto        := NULL;

  /* INICIALIZA TEXTO DAS DECIMAS */
  cTexto2       := NULL;

  DBMS_OUTPUT.PUT_LINE('CONVERTE :'||nValor);

  LOOP
    cGrupo    := cEscala;
    cCentenas := SUBSTR(cGrupo,1,1);
    cDezenas  := SUBSTR(cGrupo,2,1);
    cUnidades := SUBSTR(cGrupo,3,1);

    DBMS_OUTPUT.PUT_LINE('Grupo :'||cGrupo||' - '||cTemp);

    /* DETERMINA SEPARADOR */
    IF anterior = 1 AND cSeparador IS NULL THEN

      /* Coloca Separador PELA PRIMEIRA VEZ*/
      IF cCentenas||cDezenas||cUnidades = '000' THEN
        IF cTemp = cDivisa THEN
           cSeparador:= ' ';
        ELSE
          cSeparador := ', ';
        END IF;
      ELSIF cCentenas = '0' OR cCentenas||cDezenas||cUnidades='100' THEN
          cSeparador := ' e ';
       ELSIF cTemp = cDivisa THEN
        cSeparador := ' ';
      ELSE
        cSeparador := ', ';
      END IF;

      bSeparador := FALSE;

    ELSIF anterior = 1 AND cSeparador IS NOT NULL THEN

      /* CORRIGE SEPARADOR */
      IF cSeparador= ' e ' THEN

        cSeparador := ' de ';

      ELSIF cSeparador= ', '                        AND
            cCentenas||cDezenas||cUnidades != '000' THEN
         cSeparador := ' e ';
      ELSIF cSeparador = ', '                       AND
            cCentenas||cDezenas||cUnidades = '000'  THEN
        cSEparador := ' de ';
      END IF;

    END IF;


    /* Tem centenas */
    IF nvl(cCentenas,'0') != '0'  THEN
      SELECT
        EXTENSO
       INTO
         cExtenso
       From
         CFG_VALORES_EXTENSO
        WHERE
           ordem = 'CENTENAS'
       AND VALOR = DECODE(cCentenas||cDezenas||cUnidades, '100', cCentenas||'0', cCentenas);
       cTexto := cTexto||cSeparador||cExtenso;

       cSeparador:=NULL;
       bSeparador:=TRUE;
    END IF;

    /* Tem dezenas */
    IF NVL(cDezenas,'0') != '0' THEN

      SELECT
        EXTENSO
      INTO
        cExtenso
       FROM
        CFG_VALORES_EXTENSO
      WHERE
          ordem = 'DEZENAS'
      AND VALOR = DECODE(cDezenas,'1',cDezenas||cUnidades,cDezenas);

      IF NVL(cCentenas,'0') != '0' THEN
         cTexto := cTexto||'e '||cExtenso;
      ELSE
        cTexto := cTexto||cSeparador||cExtenso;
        cSeparador:=NULL;
      END IF;

    END IF;

    /* Obtem unidades (desde que n?o esteja entre 10 e 19)*/
     IF NVL(cDezenas,'0')  != '1'  AND
       NVL(cUnidades,'0') != '0'  THEN

      SELECT
        EXTENSO
      INTO
        cExtenso
      From
        CFG_VALORES_EXTENSO
       WHERE
          ordem = 'UNIDADES'
      AND VALOR = cUnidades;

      IF cCentenas||cDezenas != '00' THEN

        cTexto := cTexto||'e '||cExtenso;

      ELSE

        cTexto := cTexto||cSeparador||cExtenso;
         cSeparador:=NULL;

      END IF;

    END IF;

    /* excepc?es */
    /* 1 Milh?o */
    IF cUnidades = '1'        AND
       cDezenas  = '0'        AND
       cCentenas = '0'        AND
        cTemp     = 'Milhões'  THEN

      cTexto   := cTexto||'Milhão';
      anterior := 1;

    /* Mil */
    ELSIF cUnidades = '1'       AND
          cDezenas  = '0'       AND
           cCentenas = '0'       AND
          anterior  = 0         AND
          cTemp     = 'Mil'     THEN

          cTexto   := 'Mil';
          anterior := 1;

    /* fim do Grupo */
     ELSIF ( cUnidades != '0'   OR
            cDezenas  != '0'   OR
            cCentenas != '0')  AND
          cTemp     != cDivisa THEN

      cTexto := cTexto||cTemp;
      anterior := 1;

    ELSIF cTemp = cDivisa  THEN

      cTexto :=  SUBSTR(cTexto,1,length(cTexto));

    END IF;

    /* Muda de Grupo */
    IF cTemp = 'Milhões' THEN

      cTemp := 'Mil';
      cEscala :=  SUBSTR(cValorInteiro,4,3);

    ELSIF cTemp = 'Mil'  THEN

      cTemp := cDivisa;
      cEscala :=  SUBSTR(cValorInteiro,7,3);

    ELSE

      EXIT;

    END IF;

  END LOOP;

  IF cSeparador IS NOT NULL THEN
    cTexto := cTexto||cSeparador;
  END IF;

  IF cDivisa != 'Escudos'  AND
     NLSCHARS IS NOT NULL  THEN

    cTemp         := 'Centimos';

    cEscala       := SUBSTR(cValorDecimas,1,3);

    DBMS_OUTPUT.PUT_LINE(cValorDecimas);
    DBMS_OUTPUT.PUT_LINE(cEscala);

    cGrupo    := cEscala;
    cCentenas := SUBSTR(cGrupo,1,1);
    cDezenas  := SUBSTR(cGrupo,2,1);
    cUnidades := SUBSTR(cGrupo,3,1);

    IF NVL(cDezenas,'0') != '0' THEN

      SELECT
        EXTENSO
      Into
       cExtenso
      From
        CFG_VALORES_EXTENSO
      WHERE
          ordem = 'DEZENAS'
       AND VALOR = DECODE(cDezenas,'1',cDezenas||cUnidades,cDezenas);

      IF NVL(cCentenas,'0') != '0' THEN
        cTexto2 := cTexto2||'e '||cExtenso;
      ELSE
        cTexto2 := cTexto2||cExtenso;
       END IF;
    END IF;

    IF NVL(cDezenas,'0')  != '1'  AND
       NVL(cUnidades,'0') != '0'  THEN

      SELECT
        EXTENSO
      Into
        cExtenso
       From
        CFG_VALORES_EXTENSO
      WHERE
          ordem = 'UNIDADES'
      AND VALOR = cUnidades;

      cTexto2 := cTexto2||cExtenso;

    END IF;

    IF cUnidades != '0'  OR
        cDezenas  != '0'  THEN

      cTexto2 := cTexto2||cTemp;

    ELSIF cTemp = 'Centimos'  THEN

      cTexto2 :=  SUBSTR(cTexto2,1,length(cTexto2));

    END IF;

  END IF;

  IF cTexto2 IS NOT NULL THEN
    dbms_output.put_line(cTexto||cDivisa||' e '||cTexto2);
    RETURN cTexto||cDivisa||' e '||cTexto2;
  ELSE
    dbms_output.put_line(cTexto||cDivisa);
    RETURN cTexto||cDivisa;
   END IF;

End;

END PKG_APP_UTIL;
