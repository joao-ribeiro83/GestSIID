-- EUL4_BATCH_PACKAGE250311155400 (owner: SIID_TESTES)


-- ===== SPEC (PACKAGE) =====

PACKAGE EUL4_BATCH_PACKAGE250311155400 AS
   PROCEDURE RUN;
END EUL4_BATCH_PACKAGE250311155400;

-- ===== BODY (PACKAGE BODY) =====

PACKAGE BODY EUL4_BATCH_PACKAGE250311155400 AS
PROCEDURE RUN IS
   eulSchemaName    VARCHAR2(128) := 'SIID_TESTES';
   timeStamp        VARCHAR2(12) := '250311155400';
   batchReportId    NUMBER(22) := 262245;
   batchReportRunNo NUMBER(22);
   batchReportRunId NUMBER(22);
   userName         VARCHAR2(129);
   rowFetchLimit    NUMBER(22);
   batchCommitSize  NUMBER(22);
   startDate        DATE := SYSDATE;
   error            BOOLEAN := FALSE;
BEGIN

   BEGIN
      IF (SIID_TESTES.EUL4_BATCH_USER.IsReportValid(eulSchemaName,
                                          batchReportId) = FALSE) THEN
           RETURN;
      END IF;
      SIID_TESTES.EUL4_BATCH_USER.GetUserLimits(eulSchemaName,
                                      batchReportId,
                                      userName,
                                      batchCommitSize,
                                      rowFetchLimit);
      SIID_TESTES.EUL4_BATCH_USER.SetExpiredRuns(eulSchemaName,
                                       userName);
      SIID_TESTES.EUL4_BATCH_USER.SetBatchReportRunInProgress(eulSchemaName,
                                                    batchReportId,
                                                    batchReportRunNo,
                                                    batchReportRunId);

      SIID_TESTES.EUL4_BATCH_USER.ExecuteQuery(eulSchemaName,
                                     timeStamp,
                                     batchReportRunId,
                                     batchReportRunNo,
                                     userName,
                                     262253,
                                     1,
                                     'BRN1 NUMBER, BRD1 DATE, BRN2 NUMBER, BRVC1 VARCHAR2(2000), BRN3 NUMBER, BRVC2 VARCHAR2(2000), BRVC3 VARCHAR2(2000), BRN4 NUMBER, BRN5 NUMBER, BRN6 NUMBER, BRVC4 VARCHAR2(3), BRVC5 VARCHAR2(18), BRVC6 VARCHAR2(10), BRVC7 VARCHAR2(19), BRVC8 VARCHAR2(80), BRN7 NUMBER, BRD2 DATE, BRD3 DATE, BRD4 DATE, BRVC9 VARCHAR2(4000), BRD5 DATE, BRD6 DATE, BRD7 DATE, BRVC10 VARCHAR2(60), BRVC11 VARCHAR2(175), BRVC12 VARCHAR2(2000), BRVC13 VARCHAR2(175), BRVC14 VARCHAR2(175), BRVC15 VARCHAR2(2000), BRVC16 VARCHAR2(2000), BRVC17 VARCHAR2(3), BRVC18 VARCHAR2(2000), BRVC19 VARCHAR2(2000), BRVC20 VARCHAR2(2000), BRVC21 VARCHAR2(2000), BRVC22 VARCHAR2(2000), BRVC23 VARCHAR2(175), BRVC24 VARCHAR2(175), BRVC25 VARCHAR2(20), BRVC26 VARCHAR2(160), BRVC27 VARCHAR2(200), BRVC28 VARCHAR2(5), BRVC29 VARCHAR2(215), BRVC30 VARCHAR2(15), BRVC31 VARCHAR2(160), BRD8 DATE, BRD9 DATE, BRVC32 VARCHAR2(175), BRVC33 VARCHAR2(175), BRVC34 VARCHAR2(175), BRVC35 VARCHAR2(4000), BRVC36 VARCHAR2(175), BRVC37 VARCHAR2(175), BRVC38 VARCHAR2(2000), BRVC39 VARCHAR2(2000), BRVC40 VARCHAR2(2000), BRVC41 VARCHAR2(175), BRVC42 VARCHAR2(4), BRVC43 VARCHAR2(2000), BRVC44 VARCHAR2(2000), BRVC45 VARCHAR2(2000), BRVC46 VARCHAR2(2000), BRVC47 VARCHAR2(175), BRVC48 VARCHAR2(80), BRVC49 VARCHAR2(4000), BRVC50 VARCHAR2(175), BRN8 NUMBER, BRD10 DATE, BRVC51 VARCHAR2(80), BRVC52 VARCHAR2(3), BRVC53 VARCHAR2(30), BRVC54 VARCHAR2(40), BRVC55 VARCHAR2(175), BRVC56 VARCHAR2(175), BRVC57 VARCHAR2(175), BRVC58 VARCHAR2(40), BRVC59 VARCHAR2(40), BRVC60 VARCHAR2(175), BRVC61 VARCHAR2(175), BRVC62 VARCHAR2(175), BRVC63 VARCHAR2(175), BRVC64 VARCHAR2(2000), BRVC65 VARCHAR2(175), BRVC66 VARCHAR2(175), BRVC67 VARCHAR2(175), BRVC68 VARCHAR2(175), BRVC69 VARCHAR2(175), BRVC70 VARCHAR2(175), BRVC71 VARCHAR2(175), BRVC72 VARCHAR2(175), BRVC73 VARCHAR2(2000), BRVC74 VARCHAR2(175), BRVC75 VARCHAR2(175), BRVC76 VARCHAR2(175), BRVC77 VARCHAR2(2000), BRVC78 VARCHAR2(175), BRVC79 VARCHAR2(80), BRVC80 VARCHAR2(20), BRVC81 VARCHAR2(40), BRVC82 VARCHAR2(2000), BRVC83 VARCHAR2(40), BRVC84 VARCHAR2(40), BRVC85 VARCHAR2(40), BRVC86 VARCHAR2(40), BRVC87 VARCHAR2(40), BRVC88 VARCHAR2(40), BRVC89 VARCHAR2(40), BRVC90 VARCHAR2(40), BRVC91 VARCHAR2(40), BRVC92 VARCHAR2(40), BRVC93 VARCHAR2(40), BRVC94 VARCHAR2(40), BRVC95 VARCHAR2(40), BRVC96 VARCHAR2(175), BRVC97 VARCHAR2(175), BRVC98 VARCHAR2(2000), BRVC99 VARCHAR2(2000), BRN9 NUMBER, BRN10 NUMBER, BRN11 NUMBER, BRN12 NUMBER, BRN13 NUMBER, BRN14 NUMBER, BRN15 NUMBER, BRN16 NUMBER, BRN17 NUMBER, BRN18 NUMBER, BRN19 NUMBER, BRN20 NUMBER, BRN21 NUMBER, BRN22 NUMBER, BRN23 NUMBER, BRN24 NUMBER, BRN25 NUMBER, BRN26 NUMBER, BRN27 NUMBER, BRN28 NUMBER, BRN29 NUMBER, BRN30 NUMBER, BRN31 NUMBER, BRN32 NUMBER, BRN33 NUMBER, BRN34 NUMBER, BRN35 NUMBER, BRN36 NUMBER, BRN37 NUMBER, BRN38 NUMBER, BRN39 NUMBER, BRN40 NUMBER, BRN41 NUMBER, BRN42 NUMBER, BRN43 NUMBER, BRN44 NUMBER, BRN45 NUMBER, BRN46 NUMBER, BRN47 NUMBER, BRN48 NUMBER, BRN49 NUMBER, BRN50 NUMBER, BRN51 NUMBER, BRN52 NUMBER, BRN53 NUMBER, BRN54 NUMBER, BRN55 NUMBER, BRN56 NUMBER, BRN57 NUMBER, BRN58 NUMBER, BRN59 NUMBER, BRN60 NUMBER, BRN61 NUMBER, BRN62 NUMBER, BRN63 NUMBER, BRN64 NUMBER, BRN65 NUMBER, BRN66 NUMBER, BRN67 NUMBER, BRN68 NUMBER, BRN69 NUMBER, BRN70 NUMBER, BRN71 NUMBER, BRN72 NUMBER, BRN73 NUMBER, BRN74 NUMBER, BRN75 NUMBER',
                                     'batch_rec.E_73281, batch_rec.E_73217, batch_rec.E_73161, batch_rec.E_73155, batch_rec.E_73151, batch_rec.E_73081, batch_rec.E_73071, batch_rec.E114914, batch_rec.E114915, batch_rec.E114916, batch_rec.E114917, batch_rec.E114920, batch_rec.E114921, batch_rec.E114922, batch_rec.E114924, batch_rec.E114925, batch_rec.E114928, batch_rec.E114929, batch_rec.E114931, batch_rec.E114933, batch_rec.E114934, batch_rec.E114935, batch_rec.E114936, batch_rec.E114939, batch_rec.E114940, batch_rec.E114941, batch_rec.E114942, batch_rec.E114943, batch_rec.E114945, batch_rec.E114947, batch_rec.E114948, batch_rec.E114960, batch_rec.E114962, batch_rec.E114972, batch_rec.E114974, batch_rec.E114976, batch_rec.E114977, batch_rec.E114978, batch_rec.E114991, batch_rec.E114992, batch_rec.E114995, batch_rec.E114996, batch_rec.E114997, batch_rec.E114998, batch_rec.E114999, batch_rec.E115011, batch_rec.E115016, batch_rec.E115021, batch_rec.E115023, batch_rec.E115025, batch_rec.E115026, batch_rec.E115027, batch_rec.E115028, batch_rec.E116226, batch_rec.E116227, batch_rec.E116228, batch_rec.E116229, batch_rec.E116230, batch_rec.E121084, batch_rec.E145287, batch_rec.E145288, batch_rec.E145289, batch_rec.E178229, batch_rec.E179579, batch_rec.E179580, batch_rec.E179581, batch_rec.E179582, batch_rec.E179583, batch_rec.E179584, batch_rec.E198102, batch_rec.E208607, batch_rec.E208608, batch_rec.E214207, batch_rec.E221651, batch_rec.E221652, batch_rec.E229071, batch_rec.E229072, batch_rec.E229073, batch_rec.E229074, batch_rec.E229075, batch_rec.E229076, batch_rec.E229077, batch_rec.E235128, batch_rec.E235129, batch_rec.E235130, batch_rec.E235131, batch_rec.E239978, batch_rec.E239979, batch_rec.E239980, batch_rec.E244187, batch_rec.E244188, batch_rec.E244189, batch_rec.E244190, batch_rec.E245042, batch_rec.E245046, batch_rec.E252658, batch_rec.E252659, batch_rec.E254950, batch_rec.E257653, batch_rec.E257654, batch_rec.E257655, batch_rec.E257656, batch_rec.E257658, batch_rec.E257659, batch_rec.E257660, batch_rec.E257661, batch_rec.E257662, batch_rec.E257663, batch_rec.E257664, batch_rec.E257665, batch_rec.E257666, batch_rec.E257667, batch_rec.E257668, batch_rec.E257669, batch_rec.E257670, batch_rec.E262233, batch_rec.E262234, batch_rec.E_73568, batch_rec.E_73201, batch_rec.E_73195, batch_rec.E_73189, batch_rec.E_73183, batch_rec.E_73172, batch_rec.E_73168, batch_rec.E_73164, batch_rec.E_73158, batch_rec.E_73147, batch_rec.E_73131, batch_rec.E_73126, batch_rec.E_73121, batch_rec.E_73116, batch_rec.E_73111, batch_rec.E_73106, batch_rec.E_73093, batch_rec.E114949, batch_rec.E114950, batch_rec.E114951, batch_rec.E114952, batch_rec.E114953, batch_rec.E114954, batch_rec.E114955, batch_rec.E114956, batch_rec.E114957, batch_rec.E114958, batch_rec.E114963, batch_rec.E114964, batch_rec.E114965, batch_rec.E114966, batch_rec.E114967, batch_rec.E114968, batch_rec.E114969, batch_rec.E114970, batch_rec.E114979, batch_rec.E114980, batch_rec.E114981, batch_rec.E114982, batch_rec.E114983, batch_rec.E114984, batch_rec.E114985, batch_rec.E114986, batch_rec.E114987, batch_rec.E114988, batch_rec.E114989, batch_rec.E114990, batch_rec.E114993, batch_rec.E114994, batch_rec.E115000, batch_rec.E115001, batch_rec.E115002, batch_rec.E115003, batch_rec.E115005, batch_rec.E115006, batch_rec.E115007, batch_rec.E115008, batch_rec.E115009, batch_rec.E115010, batch_rec.E115012, batch_rec.E115013, batch_rec.E115014, batch_rec.E115015, batch_rec.E115019, batch_rec.E115020, batch_rec.E204472, batch_rec.E209264',
                                     batchCommitSize,
                                     rowFetchLimit,
                                     0);

   EXCEPTION
      WHEN OTHERS THEN
         error := TRUE;
   END;
   SIID_TESTES.EUL4_BATCH_USER.ScheduleRun(eulSchemaName,
                                 timeStamp,
                                 batchReportId,
                                 batchReportRunId,
                                 batchReportRunNo,
                                 error,
                                 startDate);
END RUN;
END EUL4_BATCH_PACKAGE250311155400;
