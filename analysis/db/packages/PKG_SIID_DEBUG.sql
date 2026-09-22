-- PKG_SIID_DEBUG (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PKG_SIID_DEBUG
IS
  --* CONSTANTES PROPRIAS QUESTIONAR INFORMACOES SOBRE PACKAGE
  --*
  --* CRIADO POR  : JOSE VIEGAS
  --* DATA CRIACAO: 13-01-2011
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

  /*
  -* NOME      : GET_PACKINFO
  -* OBJECTIVO : MANTER INFORMACAO SOBRE VERSAO DO PACKAGE
  -* UTILIZACAO: pkg_debug_util.GET_PACKINFO ( 'VERSAO' );
  -* AUTOR     : Eng. Jose Viegas
  -* DATA      : 25-11-2004
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       AUTOR           DESCRICAO
  -*   ========== ===============
=================================================
  -*
  -*/
  FUNCTION GET_PACKINFO ( P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE')
RETURN VARCHAR2;

  /*
  -* NOME      : SET_NIVEL_LOG
  -* OBJECTIVO : ALTERAR O NIVEL DE LOGGING NO PACKAGE
  -* UTILIZACAO: pkg_debug_util.SET_NIVEL_LOG ( ... );
  -* AUTOR     : JOSE VIEGAS
  -* DATA      : 03-08-2005
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   03-08-2005    1.0 JOSE VIEGAS      Criacao do procedimento
  -*/
  PROCEDURE SET_NIVEL_LOG ( P_NOVO_NIVEL IN NUMBER);

  /*
  -* NOME      : SET_LINGUAGEM
  -* OBJECTIVO : ALTERAR A LINGUAGEM DO PACKAGE
  -* UTILIZACAO: pkg_debug_util.SET_LINGUAGEM ( ... );
  -* AUTOR     : JOSE VIEGAS
  -* DATA      : 03-08-2005
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   03-08-2005    1.0 JOSE VIEGAS      Criacao do procedimento
  -*/
  PROCEDURE SET_LINGUA (P_NOVA_LINGUA IN VARCHAR2);

  /*
  -* NOME      : ERROR_WRITE
  -* OBJECTIVO : REGISTAR MENSAGEM DE ERRO
  -* UTILIZACAO: pkg_SIID_DEBUG.ERROR_WRITE ( ... );
  -* AUTOR     : JOSE VIEGAS
  -* DATA      : 13-01-2011
  -* VERSAO    : 1.1
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   13-01-2011    1.0 JOSE VIEGAS      Criacao do procedimento
  -*/
  PROCEDURE ERROR_WRITE ( P_NUMERO_ERRO  IN NUMBER
                        , P_MODELO_ID    IN VARCHAR2
                        , P_UTILIZADOR   IN VARCHAR2
                        , P_MENSAGEM     IN VARCHAR2 DEFAULT NULL
                        , P_QUEUE_ID     IN NUMBER DEFAULT NULL
                        , P_DOCUMENTO_ID IN NUMBER DEFAULT NULL);

  /*
  -* NOME      : DEBUG_WRITE
  -* OBJECTIVO : REGISTAR A OCORRENCIA NO LOG
  -* UTILIZACAO: pkg_SIID_DEBUG.DEBUG_WRITE ( {NUMERO DO ERRO},
'{LOCALIZACAO}', '{DESCRICAO}' );
  -* AUTOR     : JOSE VIEGAS
  -* DATA      : 13-01-2011
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   13-01-2011    1.0 JOSE VIEGAS      Criacao do procedimento
  -*/

  PROCEDURE DEBUG_WRITE ( P_NIVEL        IN NUMBER
                        , P_MODELO_ID    IN VARCHAR2
                        , P_UTILIZADOR   IN VARCHAR2
                        , P_MENSAGEM     IN VARCHAR2 DEFAULT NULL
                        , P_QUEUE_ID     IN NUMBER DEFAULT NULL
                        , P_DOCUMENTO_ID IN NUMBER DEFAULT NULL);



  /*
  -* NOME      : WRITE
  -* OBJECTIVO : REGISTAR MENSAGEM DE DEBUG NOS LOGS
  -* UTILIZACAO: pkg_debug_util.ERROR_WRITE ( ... );
  -* AUTOR     : Jose Viegas
  -* DATA      : 13-01-2011
  -* VERSAO    : 0.1
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   13-01-2011    0.1 Jose Viegas     Criacao do procedimento
  -*/
  PROCEDURE WRITE ( P_MODELO_ID    IN VARCHAR2
                  , P_UTILIZADOR   IN VARCHAR2
                  , P_MENSAGEM     IN VARCHAR2 DEFAULT NULL
                  , P_QUEUE_ID     IN NUMBER DEFAULT NULL
                  , P_DOCUMENTO_ID IN NUMBER DEFAULT NULL);



END PKG_SIID_DEBUG; 

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY PKG_SIID_DEBUG
IS

  /*
  -*
  -* ULTIMAS ALTERACOES AO PACKAGE
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
===================================================
  -*   13-01-2011    1.0 JOSE VIEGAS      Criacao do package
  */

  PACOTE         CONSTANT VARCHAR2(100):='PKG_SIID_DEBUG';
  VERSAO         CONSTANT NUMBER:=2.0;
  DATA_VERSAO    CONSTANT DATE:= TO_DATE('13-01-2011 12:00','DD-MM-YYYY
HH24:MI');
  AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='JOSE VIEGAS';
  AUTOR_VERSAO   CONSTANT VARCHAR2(100):='Jose viegas';



  /*
  -* VARIAVEIS
  */

  NIVEL_LOG NUMBER:=1;
  LINGUA VARCHAR2(10):='PT';


  /*
  -* NOME      : GET_PACKINFO
  -* OBJECTIVO : MANTER INFORMACAO SOBRE VERSAO DO PACKAGE
  -* UTILIZACAO: pkg_debug_util.GET_PACKINFO ( 'VERSAO' );
  -* AUTOR     : Eng. Jose Viegas
  -* DATA      : 29-06-2005
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   29-06-2005    1.0 JOSE VIEGAS     Adaptacao para o Instanter
  -*/

  FUNCTION GET_PACKINFO ( P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE' )
RETURN VARCHAR2 IS
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
         RETURN PACOTE||'
v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
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
         RETURN PACOTE||'
v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
      END;

    ELSIF P_TIPO_INFO = INFO_OWNER THEN
      SELECT USERNAME INTO AUX FROM USER_USERS;
      RETURN AUX;
    ELSE
      RETURN PACOTE||'
v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
    END IF;

  END GET_PACKINFO;


  /*
  -* NOME      : SET_NIVEL_LOG
  -* OBJECTIVO : ALTERAR O NIVEL DE LOGGING NO PACKAGE
  -* UTILIZACAO: PKG_SIID_DEBUG.SET_NIVEL_LOG ( {NIVEL} );
  -* AUTOR     : JOSE VIEGAS
  -* DATA      : 13-01-2011
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   13-01-2011    1.0 JOSE VIEGAS      Criacao do procedimento
  -*/

  PROCEDURE SET_NIVEL_LOG ( P_NOVO_NIVEL IN NUMBER)
  IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    lnSISTEMA NUMBER;
  BEGIN
    NIVEL_LOG := P_NOVO_NIVEL;

  EXCEPTION
     WHEN OTHERS THEN
        WRITE('SET_NIVEL_LOG',USER, 'FALHA DESCONHECIDA NA ACTUALIZACAO
NIVEL LOG');
  END SET_NIVEL_LOG;


  /*
  -* NOME      : SET_LINGUAGEM
  -* OBJECTIVO : ALTERAR A LINGUAGEM DO PACKAGE
  -* UTILIZACAO: pkg_debug_util.SET_LINGUAGEM ( '{LINGUAGEM}' );
  -* AUTOR     : Rui Bastos
  -* DATA      : 03-08-2005
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   03-08-2005    1.0 Rui Bastos      Criacao do procedimento
  -*/

  PROCEDURE SET_LINGUA ( P_NOVA_LINGUA IN VARCHAR2 ) IS
  BEGIN
    LINGUA := P_NOVA_LINGUA;
  END;


  /*
  -* NOME      : ERROR_WRITE
  -* OBJECTIVO : MANTER INFORMACAO SOBRE VERSAO DO PACKAGE
  -* UTILIZACAO: pkg_debug_util.ERROR_WRITE ( {NUMERO DO ERRO},
'{LOCALIZACAO}' );
  -* AUTOR     : Rui Bastos
  -* DATA      : 16-02-2006
  -* VERSAO    : 1.1
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   01-08-2005    1.0 Rui Bastos      Criacao do procedimento
  -*   16-02-2006    1.1 Rui Bastos      Acrescentado parametro P_UTILIZADOR
  -*/

  PROCEDURE ERROR_WRITE ( P_NUMERO_ERRO  IN NUMBER
                        , P_MODELO_ID    IN VARCHAR2
                        , P_UTILIZADOR   IN VARCHAR2
                        , P_MENSAGEM     IN VARCHAR2 DEFAULT NULL
                        , P_QUEUE_ID     IN NUMBER DEFAULT NULL
                        , P_DOCUMENTO_ID IN NUMBER DEFAULT NULL)
  IS

    PRAGMA AUTONOMOUS_TRANSACTION;
    vDescricao VARCHAR2(2000);
    nErro NUMBER := P_NUMERO_ERRO;
    l_msg varchar(2000);
  BEGIN

    INSERT
      INTO err_erros_siid
    (
        id
      , tipo_errosiid
      , modelo_id
      , queue_id
      , data_erro
      , errotipo_id
      , descricao
      , documento_id
    )
    VALUES
    (
      id_erros_seq.nextval
    , 'ERRO'
    , P_MODELO_ID   
    , p_queue_id
    , sysdate
    , P_NUMERO_ERRO
    , P_UTILIZADOR||':'||P_MENSAGEM
    , p_documento_id
    );

    COMMIT;

  EXCEPTION
    WHEN OTHERS THEN
      l_msg := sqlerrm;
      insert into err_erros_siid (
        id
    , tipo_errosiid
    , modelo_id
    , queue_id
    , data_erro
    , errotipo_id
    , descricao
    , documento_id )
    values (
      id_erros_seq.nextval
    , 'ERRO_EW'
    , p_modelo_id
    , null
    , sysdate
    , null
    , l_msg
    , null );
    commit;
  END ERROR_WRITE;


  /*
  -* NOME      : DEBUG_WRITE
  -* OBJECTIVO : REGISTAR A OCORRENCIA NO LOG
  -* UTILIZACAO: pkg_debug_util.DEBUG_WRITE ( {NUMERO DO ERRO},
'{LOCALIZACAO}', '{DESCRICAO}' );
  -* AUTOR     : Rui Bastos
  -* DATA      : 01-08-2005
  -* VERSAO    : 1.0
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   01-08-2005    1.0 Rui Bastos      Criacao do procedimento
  -*/

  PROCEDURE DEBUG_WRITE ( P_NIVEL        IN NUMBER
                        , P_MODELO_ID    IN VARCHAR2
                        , P_UTILIZADOR   IN VARCHAR2
                        , P_MENSAGEM     IN VARCHAR2 DEFAULT NULL
                        , P_QUEUE_ID     IN NUMBER DEFAULT NULL
                        , P_DOCUMENTO_ID IN NUMBER DEFAULT NULL)
  IS
  l_msg varchar(2000);
  BEGIN

    IF P_NIVEL >= NIVEL_LOG THEN
      -- REGISTAR NO LOG

      INSERT
        INTO err_erros_siid
      (
          id
        , tipo_errosiid
        , modelo_id
        , queue_id
        , data_erro
        , errotipo_id
        , descricao
        , documento_id
      )
      VALUES
      (
        id_erros_seq.nextval
      , 'DEBUG'
      , P_MODELO_ID   
      , p_queue_id
      , sysdate
      , NULL
      , P_UTILIZADOR||':'||P_MENSAGEM
      , p_documento_id
      );

    COMMIT;
    END IF;


  EXCEPTION
    WHEN OTHERS THEN
      l_msg := sqlerrm;
      insert into err_erros_siid (
        id
    , tipo_errosiid
    , modelo_id
    , queue_id
    , data_erro
    , errotipo_id
    , descricao
    , documento_id )
    values (
      id_erros_seq.nextval
    , 'ERRO_DW'
    , p_modelo_id
    , null
    , sysdate
    , null
    , l_msg
    , null );
    commit;
  END DEBUG_WRITE;

  /*
  -* NOME      : WRITE
  -* OBJECTIVO : REGISTAR MENSAGEM DE DEBUG NOS LOGS
  -* UTILIZACAO: pkg_debug_util.ERROR_WRITE ( ... );
  -* AUTOR     : Jose Viegas
  -* DATA      : 25-04-2007
  -* VERSAO    : 0.1
  -*
  -* ULTIMAS ALTERACOES
  -*
  -*   DATA       VERSAO AUTOR           DESCRICAO
  -*   ========== ====== ===============
=================================================
  -*   25-04-2007    0.1 Jose Viegas     Criacao do procedimento
  -*/
  PROCEDURE WRITE ( P_MODELO_ID    IN VARCHAR2
                  , P_UTILIZADOR   IN VARCHAR2
                  , P_MENSAGEM     IN VARCHAR2 DEFAULT NULL
                  , P_QUEUE_ID     IN NUMBER DEFAULT NULL
                  , P_DOCUMENTO_ID IN NUMBER DEFAULT NULL)
  IS
    PRAGMA AUTONOMOUS_TRANSACTION;
    lnNIVEL_SISTEMA NUMBER;
    lnEMPRESA_SISTEMA NUMBER;
    lcERRO  VARCHAR2(2000);
    l_msg varchar(2000);
  BEGIN

    INSERT
      INTO err_erros_siid
    (
        id
      , tipo_errosiid
      , modelo_id
      , queue_id
      , data_erro
      , errotipo_id
      , descricao
      , documento_id
    )
    VALUES
    (
      id_erros_seq.nextval
    , 'MESG'
    , P_MODELO_ID   
    , p_queue_id
    , sysdate
    , NULL
    , P_UTILIZADOR||':'||P_MENSAGEM
    , p_documento_id
    );

    COMMIT;

  EXCEPTION
    WHEN OTHERS THEN
      l_msg := sqlerrm;
      insert into err_erros_siid (
        id
    , tipo_errosiid
    , modelo_id
    , queue_id
    , data_erro
    , errotipo_id
    , descricao
    , documento_id )
    values (
      id_erros_seq.nextval
    , 'ERRO_WR'
    , p_modelo_id
    , null
    , sysdate
    , null
    , l_msg
    , null );
    commit;
  END WRITE;

END PKG_SIID_DEBUG; 
