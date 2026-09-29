-- PKG_LOG_ERRO (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE "PKG_LOG_ERRO" 
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
  -* UTILIZACAO: PKG_LOG_ERRO.GET_PACKINFO ( 'VERSAO' );
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
  FUNCTION GET_PACKINFO ( P_TIPO_INFO VARCHAR2 DEFAULT 'COMPLETE') RETURN VARCHAR2;

	/*
  -* NOME      : WRITE
  -* OBJECTIVO : REGISTAR MENSAGEM DE LOGS
  -* UTILIZACAO: PKG_LOG_ERRO.WRITE ( ... );
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
  PROCEDURE WRITE (  p_type_log     varchar2
									 , p_msg          varchar2
									 , p_modelo_id    varchar2 default null
									 , p_documento_id number   default null
									 , p_queue_id     number   default null
									 , p_errotipo_id  varchar2 default null);



END PKG_LOG_ERRO; 

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY "PKG_LOG_ERRO" 
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
  DATA_VERSAO    CONSTANT DATE:= TO_DATE('13-01-2011 12:00','DD-MM-YYYY HH24:MI');
  AUTOR_PACKAGE  CONSTANT VARCHAR2(100):='JOSE VIEGAS';
  AUTOR_VERSAO   CONSTANT VARCHAR2(100):='Jose viegas';

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
         RETURN PACOTE||'v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
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
         RETURN PACOTE||'v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
      END;

    ELSIF P_TIPO_INFO = INFO_OWNER THEN
      SELECT USERNAME INTO AUX FROM USER_USERS;
      RETURN AUX;
    ELSE
      RETURN PACOTE||'v'||VERSAO||'('||TO_CHAR(DATA_VERSAO,'YYMMDDHH24MI')||')';
    END IF;

  END GET_PACKINFO;

	/*
  -* NOME      : WRITE
  -* OBJECTIVO : REGISTAR MENSAGEM NOS LOGS
  -* UTILIZACAO: PKG_LOG_ERRO.WRITE ( ... );
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
  PROCEDURE WRITE (  p_type_log     varchar2
									 , p_msg          varchar2
									 , p_modelo_id    varchar2 default null
									 , p_documento_id number   default null
									 , p_queue_id     number   default null
									 , p_errotipo_id  varchar2 default null)
  IS
    PRAGMA AUTONOMOUS_TRANSACTION;
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
			, p_type_log
			, P_MODELO_ID   
			, p_queue_id
			, sysdate
			, p_errotipo_id
			, p_msg
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

END PKG_LOG_ERRO; 
