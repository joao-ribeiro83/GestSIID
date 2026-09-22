-- PCK_ERRGE (owner: GADOR_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE PCK_ERRGE AS
/*
 * Bloque de constanstes que contienen cada uno de los mensajes de uso general del sistema
 * cada constante tiene una funcion que retorna su valor a la interfaz
 *
 * Para agregar una nueva constante solo debe seguir las siguientes indicaciones
 *
 * Agregue la cosntante FUNCTION ERR + el numero consecutivo que sigue a la ultima constante  * existente
 * Agregue la funcion FUNCTION ERR + numero consecutivo que correscponde RETURN VARCHAR2;
 * Agregue el cuerpo de la funcion el cual debe realizar RETURN L_ERR + el numero de consecutivo
 *
 */

 /* Definicion de Constantes */

  L_ERR001 constant VARCHAR2(100) := 'Valor do campo n?o pode ser modificado';
  L_ERR002 CONSTANT VARCHAR2(100) := 'Valor do campo e obrigatorio';
  L_ERR003 CONSTANT VARCHAR2(100) := 'Valor do campo n?o pode conter caracteres n?o numericos';
  L_ERR004 CONSTANT VARCHAR2(100) := 'Formato incorrecto';
  L_ERR005 CONSTANT VARCHAR2(100) := 'Valor deve estar compreendido entre';
  L_ERR006 CONSTANT VARCHAR2(100) := 'Valor do campo deve ser maior que';
  L_ERR007 CONSTANT VARCHAR2(100) := 'Registo ja existe o contem campos nulos';
  L_ERR008 CONSTANT VARCHAR2(100) := 'Func?o da tecla n?o disponivel';
  L_ERR009 CONSTANT VARCHAR2(120) := 'N?o pode apagar um registo maestro quando existem registos de detalhe que dependem do mesmo';
  L_ERR010 CONSTANT VARCHAR2(100) := 'Registo reservado por outro utilizador';
  L_ERR011 CONSTANT VARCHAR2(100) := 'N?o existem registos para os dados especificados';
  L_ERR012 CONSTANT VARCHAR2(150) := 'Valor do campo data do inicio n?o pode ser menor que valor do campo data de fim';
  L_ERR013 CONSTANT VARCHAR2(150) := 'Valor do campo do inicio n?o pode ser menor que valor do campo de fim';
  L_ERR014 CONSTANT VARCHAR2(100) := 'N?o ha mais registos para consultar';
  L_ERR015 CONSTANT VARCHAR2(100) := 'Deseja guardar as alterac?es realizadas?';
  L_ERR016 CONSTANT VARCHAR2(100) := 'N?o existem registos que consultar';
  L_ERR017 CONSTANT VARCHAR2(100) := 'As alterac?es foram guardadas';
  L_ERR018 CONSTANT VARCHAR2(100) := 'Deve preencher o registo ou elimina-lo para continuar';
  L_ERR019 CONSTANT VARCHAR2(100) := 'Password de utilizador e incorrecta';
  L_ERR020 CONSTANT VARCHAR2(100) := 'Periodo de actividade do utilizador ha finalizado';
  L_ERR021 CONSTANT VARCHAR2(100) := 'Utilizador n?o esta activado';
  L_ERR022 CONSTANT VARCHAR2(120) := 'Indique tipo de comando de menu 1 = submenu/menu  2 = chamada a ecr?  3 = execuc?o de processo';
  L_ERR023 CONSTANT VARCHAR2(100) := 'Password de utilizador n?o esta confirmada';
  L_ERR024 CONSTANT VARCHAR2(100) := 'Password de utilizador e obrigatoria';
  L_ERR025 CONSTANT VARCHAR2(100) := 'Valor para o campo deve ser menor que';
  L_ERR026 CONSTANT VARCHAR2(100) := 'Valor para o campo n?o deve ser igual a';
  L_ERR027 CONSTANT VARCHAR2(100) := 'Valor para o campo deve ser igual a ';
  L_ERR028 CONSTANT VARCHAR2(100) := 'Deve existir como minimo um elemento seleccionado';
  L_ERR029 CONSTANT VARCHAR2(100) := 'N?o foi possivel estabelecer conex?o com a base de dados';
  L_ERR030 CONSTANT VARCHAR2(100) := 'Valor para o campo deve ser um dos seguintes dados';
  L_ERR031 CONSTANT VARCHAR2(100) := 'Utilizador ja existe na base de dados';
  L_ERR032 CONSTANT VARCHAR2(100) := 'Utilizador com privilegios insuficientes';

  /* Especificaciones de Funciones */

  FUNCTION ERR001 RETURN VARCHAR2;
  FUNCTION ERR002 RETURN VARCHAR2;
  FUNCTION ERR003 RETURN VARCHAR2;
  FUNCTION ERR004 RETURN VARCHAR2;
  FUNCTION ERR005 RETURN VARCHAR2;
  FUNCTION ERR006 RETURN VARCHAR2;
  FUNCTION ERR007 RETURN VARCHAR2;
  FUNCTION ERR008 RETURN VARCHAR2;
  FUNCTION ERR009 RETURN VARCHAR2;
  FUNCTION ERR010 RETURN VARCHAR2;
  FUNCTION ERR011 RETURN VARCHAR2;
  FUNCTION ERR012 RETURN VARCHAR2;
  FUNCTION ERR013 RETURN VARCHAR2;
  FUNCTION ERR014 RETURN VARCHAR2;
  FUNCTION ERR015 RETURN VARCHAR2;
  FUNCTION ERR016 RETURN VARCHAR2;
  FUNCTION ERR017 RETURN VARCHAR2;
  FUNCTION ERR018 RETURN VARCHAR2;
  FUNCTION ERR019 RETURN VARCHAR2;
  FUNCTION ERR020 RETURN VARCHAR2;
  FUNCTION ERR021 RETURN VARCHAR2;
  FUNCTION ERR022 RETURN VARCHAR2;
  FUNCTION ERR023 RETURN VARCHAR2;
  FUNCTION ERR024 RETURN VARCHAR2;
  FUNCTION ERR025 RETURN VARCHAR2;
  FUNCTION ERR026 RETURN VARCHAR2;
  FUNCTION ERR027 RETURN VARCHAR2;
  FUNCTION ERR028 RETURN VARCHAR2;
  FUNCTION ERR029 RETURN VARCHAR2;
  FUNCTION ERR030 RETURN VARCHAR2;
  FUNCTION ERR031 RETURN VARCHAR2;
  FUNCTION ERR032 RETURN VARCHAR2;

END PCK_ERRGE;

