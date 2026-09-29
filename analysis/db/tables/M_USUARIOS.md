# M_USUARIOS

Owner: `GADOR_TESTES` &nbsp; Type: `TABLE`

Row count: **6297**

## Columns

| NAME | TYPE | LENGTH | PRECISION | SCALE | NULLABLE | DEFAULT | COMMENT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CDIDUSR | VARCHAR2 | 30 |  |  | N |  | Codigo identificador de usuario |
| OTPWDUSR | VARCHAR2 | 128 |  |  | N |  | password usuario encriptado |
| CDDBROL | VARCHAR2 | 30 |  |  | Y |  | codigo del rol de base de dados |
| CDPERFIL | VARCHAR2 | 3 |  |  | N |  | Codigo de perfil |
| DSUSUARIO | VARCHAR2 | 40 |  |  | N |  | descripcion del usuario |
| FEACTDES | DATE | 7 |  |  | N |  | Data de inicio de actividad |
| FEACTHAS | DATE | 7 |  |  | N |  | Data de fin de actividad |
| SWACTIVO | VARCHAR2 | 1 |  |  | N |  | Indicador de activo S,N |
| SWDBUSR | VARCHAR2 | 1 |  |  | N |  | indicador de usuario de base de datos |
| USERCLASE | VARCHAR2 | 1 |  |  | Y |  | Clase de Usuario |
| USERNEMP | NUMBER | 22 | 3 | 0 | Y |  | Numero de empregado |
| USERMAIL | VARCHAR2 | 60 |  |  | Y |  | Utilizador de correo |
| IDRESPON | VARCHAR2 | 30 |  |  | Y |  | Identificador responsabilidad |
| USERTIPO | VARCHAR2 | 1 |  |  | Y |  | Tipo de Usuario |
| USERACCES | VARCHAR2 | 1 |  |  | Y |  | Usuario que accede |
| CDINTER | VARCHAR2 | 1 |  |  | Y |  | Codigo interno |
| USERNMAIL | VARCHAR2 | 1 |  |  | Y |  | Indicador envio e-mail |
| CDTIPSRV | VARCHAR2 | 3 |  |  | Y |  | Tipo de acceso al servidor para usuarios |
| FECAMPAS | DATE | 7 |  |  | Y |  | Data da ultima mudanca de password |
| CDTIPUTI | VARCHAR2 | 2 |  |  | Y |  | Tipo de utilizador pelas apolizes |
| NMUSTENT | NUMBER | 22 |  |  | Y |  | Numero de tentativas de password do utilizador. |
| FEULTACC | DATE | 7 |  |  | Y |  | Data ultimo acesso utilizador |
| CDLINGUA | VARCHAR2 | 2 |  |  | Y |  |  |
| CDMOTDES | VARCHAR2 | 2 |  |  | Y |  | Motivo da sua desativac?o |
| SWGENERI | VARCHAR2 | 1 |  |  | Y |  | Indicador para identificar utilizadores genericos |
| SWCHGPWD | VARCHAR2 | 1 |  |  | Y |  | Indicador para identificar a necessidade de alterar password |
| SWNATIVEMSG | VARCHAR2 | 1 |  |  | Y |  | Indicador se o utilizador pretende ou não receber mensagens nativas no telemóvel. |
| CDUNIECO | VARCHAR2 | 1 |  |  | Y |  | Código Unidade económica |
| IDKEYPWD | VARCHAR2 | 32 |  |  | Y |  | Identificador chave password |


## Primary / unique keys

| CONSTRAINT_NAME | CONSTRAINT_TYPE | COLUMN_NAME | POSITION |
| --- | --- | --- | --- |
| M_USUARIOS_PK | P | CDIDUSR | 1 |


## Foreign keys

| CONSTRAINT_NAME | COLUMN_NAME | POSITION | R_OWNER | R_TABLE_NAME |
| --- | --- | --- | --- | --- |
| M_USUARIOS_M_PERFILES_FK | CDPERFIL | 1 | GADOR_TESTES | M_PERFILES |
| M_USUARIOS_M_USRROLES_FK | CDDBROL | 1 | GADOR_TESTES | M_USRROLES |


## Indexes

| INDEX_NAME | UNIQUENESS | COLUMN_NAME | COLUMN_POSITION |
| --- | --- | --- | --- |
| M_USUARIOS_PK | UNIQUE | CDIDUSR | 1 |

