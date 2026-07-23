-- ============================================================
-- BASE DE DATOS CLÍNICA VETERINARIA - VERSIÓN NORMALIZADA
-- Correcciones aplicadas según observaciones del profesor
-- ============================================================

-- ============================================================
-- SECCIÓN 1: CONTROL Y AUDITORÍA
-- ============================================================

-- Tabla de control centralizado (reemplaza CREATED_AT/UPDATED_AT dispersos)
CREATE TABLE `control` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `TABLA`       varchar(100) NOT NULL,
  `REGISTRO_ID` int          NOT NULL,
  `ACCION`      varchar(20)  NOT NULL COMMENT 'INSERT | UPDATE | DELETE',
  `EMPLEADO_ID` int,
  `FECHA`       timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Historial de modificaciones (en lugar de sobreescribir registros)
CREATE TABLE `historial` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `TABLA`       varchar(100) NOT NULL,
  `REGISTRO_ID` int          NOT NULL,
  `CAMPO`       varchar(100) NOT NULL,
  `VALOR_ANTES` text,
  `VALOR_DESPUES` text,
  `EMPLEADO_ID` int,
  `FECHA`       timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SECCIÓN 2: CLÍNICA (separada de empleados/administrador)
-- ============================================================

CREATE TABLE `clinica` (
  `ID`       int PRIMARY KEY AUTO_INCREMENT,
  `NOMBRE`   varchar(150) NOT NULL,
  `EMAIL`    varchar(150) UNIQUE,
  `TELEFONO` varchar(20),
  `LOGO_URL` varchar(500),
  `ACTIVA`   tinyint      NOT NULL DEFAULT 1,
  -- Dirección compuesta
  `DIR_CALLE`   varchar(200),
  `DIR_NUMERO`  varchar(20),
  `DIR_COLONIA` varchar(150),
  `DIR_CP`      varchar(10),
  `DIR_CIUDAD`  varchar(100),
  `DIR_ESTADO`  varchar(100)
);

-- ============================================================
-- SECCIÓN 3: EMPLEADOS Y ROLES
-- ============================================================

CREATE TABLE `rol` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`  int          NOT NULL,
  `NOMBRE`      varchar(100) NOT NULL,
  `DESCRIPCION` text
);

-- Administrador separado de la clínica (credenciales de acceso)
CREATE TABLE `administrador` (
  `ID`            int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`    int          NOT NULL,
  `NOMBRE`        varchar(100) NOT NULL,
  `APELLIDOS`     varchar(150),
  `EMAIL`         varchar(150) UNIQUE NOT NULL,
  `PASSWORD_HASH` varchar(255) NOT NULL,
  `ACTIVO`        tinyint      NOT NULL DEFAULT 1
);

CREATE TABLE `empleado` (
  `ID`            int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`    int          NOT NULL,
  `ROL_ID`        int          NOT NULL,
  `NOMBRE`        varchar(100) NOT NULL,
  `APELLIDOS`     varchar(150),
  `EMAIL`         varchar(150) UNIQUE,
  `PASSWORD_HASH` varchar(255),
  `TELEFONO`      varchar(20),
  `CEDULA_PROF`   varchar(50),
  `ACTIVO`        tinyint      NOT NULL DEFAULT 1
);

-- ============================================================
-- SECCIÓN 4: TUTOR
-- ============================================================

CREATE TABLE `tutor` (
  `ID`        int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID` int NOT NULL,
  `NOMBRE`    varchar(100) NOT NULL,
  `APELLIDOS` varchar(150),
  `TELEFONO`  varchar(20),
  `WHATSAPP`  varchar(20),
  `CORREO`    varchar(100),
  -- Dirección compuesta
  `DIR_CALLE`   varchar(200),
  `DIR_NUMERO`  varchar(20),
  `DIR_COLONIA` varchar(150),
  `DIR_CP`      varchar(10),
  `DIR_CIUDAD`  varchar(100),
  `DIR_ESTADO`  varchar(100),
  `CODIGO`    varchar(30) UNIQUE,
  `TAGS`      varchar(255),
  `VETADO`    tinyint NOT NULL DEFAULT 0,
  `ESTATUS`   varchar(50)
);

-- ============================================================
-- SECCIÓN 5: PACIENTE (atributos multivaluados externalizados)
-- ============================================================

CREATE TABLE `paciente` (
  `ID`               int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`       int          NOT NULL,
  `TUTOR_ID`         int          NOT NULL,
  `NOMBRE`           varchar(100) NOT NULL,
  `ESPECIE`          varchar(50),
  `RAZA`             varchar(100),
  `SEXO`             varchar(20),
  `FECHA_NACIMIENTO` date,
  `MICROCHIP`        varchar(50)
  -- FUNCION_ZOOTECNICA, TATUAJE y ESQUEMAS_PREVENTIVOS
  -- se mueven a tablas externas (ver abajo)
);

-- Atributo multivaluado: Función Zootécnica
CREATE TABLE `paciente_funcion_zootecnica` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `PACIENTE_ID` int          NOT NULL,
  `FUNCION`     varchar(100) NOT NULL,
  `DESCRIPCION` text
);

-- Atributo multivaluado: Tatuajes
CREATE TABLE `paciente_tatuaje` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `PACIENTE_ID` int         NOT NULL,
  `CODIGO`      varchar(50) NOT NULL,
  `UBICACION`   varchar(100),
  `FECHA`       date
);

-- Atributo multivaluado: Esquemas Preventivos
CREATE TABLE `paciente_esquema_preventivo` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `PACIENTE_ID` int          NOT NULL,
  `TIPO`        varchar(100) NOT NULL COMMENT 'Vacuna, Desparasitación, etc.',
  `DESCRIPCION` text,
  `FECHA_INICIO` date,
  `FECHA_FIN`   date
);

-- Vacunas (asociadas directamente al paciente)
CREATE TABLE `vacuna` (
  `ID`                 int PRIMARY KEY AUTO_INCREMENT,
  `PACIENTE_ID`        int          NOT NULL,
  `NOMBRE`             varchar(100) NOT NULL,
  `FECHA_APLICACION`   date,
  `PROXIMA_DOSIS`      date,
  `LOTE`               varchar(50),
  `FABRICANTE`         varchar(255),
  `VIA_ADMINISTRACION` varchar(50),
  `DOSIS`              varchar(100),
  `OBSERVACIONES`      text
);

-- ============================================================
-- SECCIÓN 6: EXPEDIENTE (sin CLINICA_ID, asociado a paciente)
-- ============================================================

CREATE TABLE `expediente` (
  `ID`             int PRIMARY KEY AUTO_INCREMENT,
  `PACIENTE_ID`    int  NOT NULL,
  -- CLINICA_ID eliminado (se obtiene a través de paciente)
  `FECHA_APERTURA` date NOT NULL
  -- Los campos clínicos (anamnesis, examen físico, etc.)
  -- se registran por consulta, no en el expediente
);

-- ============================================================
-- SECCIÓN 7: CONSULTA (nodo central del modelo IMSS)
-- Conecta: Paciente, Médico, Receta, Diagnóstico, Orden de Cirugía
-- ============================================================

CREATE TABLE `consulta` (
  `ID`                   int PRIMARY KEY AUTO_INCREMENT,
  `PACIENTE_ID`          int  NOT NULL,
  `EXPEDIENTE_ID`        int  NOT NULL,
  `EMPLEADO_ID`          int  NOT NULL,
  `FECHA`                date NOT NULL,
  `MOTIVO`               text,
  `ANAMNESIS`            text,
  `EXAMEN_FISICO`        text,
  `EXAMENES_SISTEMICOS`  text,
  `LISTA_PROBLEMAS`      text,
  `DX_PRESUNTIVO`        text,
  `ABORDAJE_DX`          text,
  `DX_DEFINITIVO`        text,
  `TRATAMIENTO`          text,
  `TRATAMIENTO_ETIOLOGICO` text,
  `SEGUIMIENTO_MEDICO`   text,
  `RESUMEN`              text
);

-- Diagnóstico asociado a consulta
CREATE TABLE `diagnostico` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `CONSULTA_ID` int  NOT NULL,
  `DESCRIPCION` text NOT NULL,
  `TIPO`        varchar(100)
);

-- Tratamiento/medicación asociado a consulta
CREATE TABLE `tratamiento` (
  `ID`            int PRIMARY KEY AUTO_INCREMENT,
  `CONSULTA_ID`   int          NOT NULL,
  `MEDICAMENTO`   varchar(150) NOT NULL,
  `DOSIS`         varchar(100),
  `VIA`           varchar(50),
  `DURACION_DIAS` int
);

-- Receta asociada a consulta (sin campo MOTIVO)
CREATE TABLE `receta` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `CONSULTA_ID` int  NOT NULL,
  `EMPLEADO_ID` int  NOT NULL,
  `FECHA`       date NOT NULL,
  `INDICACIONES` text
);

CREATE TABLE `receta_item` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `RECETA_ID`   int          NOT NULL,
  `MEDICAMENTO` varchar(150) NOT NULL,
  `DOSIS`       varchar(100),
  `VIA`         varchar(50),
  `FRECUENCIA`  varchar(100),
  `DURACION`    varchar(100),
  `CANTIDAD`    varchar(50)
);

-- ============================================================
-- SECCIÓN 8: ORDEN DE CIRUGÍA → CIRUGÍA
-- (Orden conecta con Consulta; Cirugía conecta con Orden)
-- ============================================================

CREATE TABLE `orden_cirugia` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `CONSULTA_ID` int  NOT NULL,
  `PACIENTE_ID` int  NOT NULL,
  `EMPLEADO_ID` int  NOT NULL,
  `FECHA_ORDEN` date NOT NULL,
  `PROCEDIMIENTO_SOLICITADO` varchar(200),
  `JUSTIFICACION` text,
  `PRIORIDAD`   varchar(50)
);

CREATE TABLE `cirugia` (
  `ID`               int PRIMARY KEY AUTO_INCREMENT,
  `ORDEN_CIRUGIA_ID` int  NOT NULL,
  `PACIENTE_ID`      int  NOT NULL,
  `FECHA`            date NOT NULL,
  `PROCEDIMIENTO`    varchar(200),
  `PLAN_QUIRURGICO`  text,
  `NOTAS`            text,
  `CONSENTIMIENTO`   text
);

CREATE TABLE `cirugia_empleado` (
  `CIRUGIA_ID`  int NOT NULL,
  `EMPLEADO_ID` int NOT NULL,
  `ROL_EN_CIRUGIA` varchar(100),
  PRIMARY KEY (`CIRUGIA_ID`, `EMPLEADO_ID`)
);

CREATE TABLE `anestesia` (
  `ID`           int PRIMARY KEY AUTO_INCREMENT,
  `CIRUGIA_ID`   int          NOT NULL,
  `PROTOCOLO`    varchar(200),
  `FARMACOS`     text,
  `DOSIS`        text,
  `OBSERVACIONES` text
);

-- ============================================================
-- SECCIÓN 9: HOSPITALIZACIÓN (asociada a paciente)
-- ============================================================

CREATE TABLE `hospitalizacion` (
  `ID`                           int PRIMARY KEY AUTO_INCREMENT,
  `PACIENTE_ID`                  int  NOT NULL,
  `CONSULTA_ID`                  int,
  `FECHA_INGRESO`                date NOT NULL,
  `HISTORIA_CLINICA`             text,
  `ABORDAJE_HOSPITALARIO`        text,
  `TRATAMIENTO_INTRAHOSPITALARIO` text,
  `ABORDAJE_DIAGNOSTICO`         text,
  `PLAN_DIAGNOSTICO`             text,
  `TIPO_ALTA`                    varchar(50),
  `ACTA_RESPONSIVA`              tinyint NOT NULL DEFAULT 0
);

CREATE TABLE `hospitalizacion_empleado` (
  `HOSPITALIZACION_ID` int NOT NULL,
  `EMPLEADO_ID`        int NOT NULL,
  PRIMARY KEY (`HOSPITALIZACION_ID`, `EMPLEADO_ID`)
);

CREATE TABLE `seguimiento_hospitalizacion` (
  `ID`                  int PRIMARY KEY AUTO_INCREMENT,
  `HOSPITALIZACION_ID`  int  NOT NULL,
  `FECHA`               date NOT NULL,
  `REVALORACION`        text,
  `AJUSTE_TERAPEUTICO`  text,
  `PLAN_DIAGNOSTICO`    text
);

CREATE TABLE `alta` (
  `ID`                 int PRIMARY KEY AUTO_INCREMENT,
  `HOSPITALIZACION_ID` int  NOT NULL,
  `FECHA`              date NOT NULL,
  `TIPO`               varchar(100),
  `INDICACIONES`       text
);

-- ============================================================
-- SECCIÓN 10: INVENTARIO Y SERVICIOS
-- ============================================================

CREATE TABLE `inventario` (
  `ID`           int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`   int          NOT NULL,
  `NOMBRE`       varchar(155) NOT NULL,
  `DESCRIPCION`  text,
  -- Código de barras/escáner: se almacena la ruta o dato volumétrico
  `CODIGO_IMAGEN` varchar(500) COMMENT 'Ruta de imagen o dato de escáner (código de barras)',
  `STOCK`        int          NOT NULL DEFAULT 0,
  `STOCK_MINIMO` int          NOT NULL DEFAULT 0,
  `PRECIO`       decimal(10,2),
  `UNIDAD`       varchar(50)
);

CREATE TABLE `solicitud_reabastecimiento` (
  `ID`              int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`      int          NOT NULL,
  `EMPLEADO_ID`     int          NOT NULL,
  `PRODUCTO_ID`     int          NOT NULL,
  `CANTIDAD`        int          NOT NULL,
  `NOTAS`           text,
  `STATUS`          varchar(50)  NOT NULL DEFAULT 'PENDIENTE',
  `FECHA_SOLICITUD` timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Catálogo de servicios
CREATE TABLE `servicio_catalogo` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`  int          NOT NULL,
  `CATEGORIA`   varchar(100),
  `NOMBRE`      varchar(200) NOT NULL,
  `PRECIO_ACTUAL` decimal(10,2),
  `ACTIVO`      tinyint      NOT NULL DEFAULT 1
);

-- Historial de precios del catálogo de servicios (tabla externa)
CREATE TABLE `servicio_historial_precio` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `SERVICIO_ID` int           NOT NULL,
  `PRECIO`      decimal(10,2) NOT NULL,
  `FECHA_DESDE` date          NOT NULL,
  `FECHA_HASTA` date,
  `EMPLEADO_ID` int           COMMENT 'Quién realizó el cambio'
);

CREATE TABLE `catalogo_medicamentos` (
  `ID`                   int PRIMARY KEY AUTO_INCREMENT,
  `NOMBRE`               varchar(150) NOT NULL,
  `CATEGORIA`            varchar(100),
  `ESPECIE_DESTINO`      varchar(255),
  `DOSIS_MG_POR_KG`      decimal(10,4),
  `DOSIS_MIN_MG_KG`      decimal(10,4),
  `DOSIS_MAX_MG_KG`      decimal(10,4),
  `CONCENTRACION_MG_ML`  decimal(10,4),
  `VIA_ADMINISTRACION`   varchar(50),
  `NOTAS_CLINICAS`       text
);

CREATE TABLE `catalogo_toxicologia` (
  `ID`                          int PRIMARY KEY AUTO_INCREMENT,
  `TOXINA`                      varchar(150) NOT NULL,
  `ESPECIE_AFECTADA`            varchar(255),
  `DOSIS_TOXICA_LEVE_MG_KG`     decimal(10,4),
  `DOSIS_TOXICA_MODERADA_MG_KG` decimal(10,4),
  `DOSIS_TOXICA_LETAL_MG_KG`    decimal(10,4),
  `MECANISMO`                   varchar(255),
  `SIGNOS_CLINICOS`             text,
  `TRATAMIENTO_BASE`            text,
  `NOTAS`                       text
);

-- ============================================================
-- SECCIÓN 11: RECIBO / FACTURACIÓN
-- (asociado a consulta, no a expediente)
-- ============================================================

CREATE TABLE `recibo` (
  `ID`          int PRIMARY KEY AUTO_INCREMENT,
  `CLINICA_ID`  int           NOT NULL,
  `CONSULTA_ID` int           NOT NULL,
  `PACIENTE_ID` int           NOT NULL,
  `EMPLEADO_ID` int           NOT NULL,
  `FECHA`       date          NOT NULL,
  `TOTAL`       decimal(10,2),
  `STATUS`      varchar(50)   NOT NULL DEFAULT 'PENDIENTE'
);

CREATE TABLE `recibo_item` (
  `ID`              int PRIMARY KEY AUTO_INCREMENT,
  `RECIBO_ID`       int           NOT NULL,
  `SERVICIO_ID`     int,
  `NOMBRE_SERVICIO` varchar(200)  NOT NULL,
  `PRECIO_UNITARIO` decimal(10,2) NOT NULL,
  `CANTIDAD`        int           NOT NULL DEFAULT 1,
  `SUBTOTAL`        decimal(10,2) NOT NULL,
  `NOTAS`           text
);

-- ============================================================
-- SECCIÓN 12: LLAVES FORÁNEAS
-- ============================================================

-- Control y Historial
ALTER TABLE `control`   ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado` (`ID`);
ALTER TABLE `historial` ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado` (`ID`);

-- Clínica → Rol, Administrador, Empleado
ALTER TABLE `rol`            ADD FOREIGN KEY (`CLINICA_ID`) REFERENCES `clinica` (`ID`);
ALTER TABLE `administrador`  ADD FOREIGN KEY (`CLINICA_ID`) REFERENCES `clinica` (`ID`);
ALTER TABLE `empleado`       ADD FOREIGN KEY (`CLINICA_ID`) REFERENCES `clinica` (`ID`);
ALTER TABLE `empleado`       ADD FOREIGN KEY (`ROL_ID`)     REFERENCES `rol`     (`ID`);

-- Tutor
ALTER TABLE `tutor` ADD FOREIGN KEY (`CLINICA_ID`) REFERENCES `clinica` (`ID`);

-- Paciente
ALTER TABLE `paciente` ADD FOREIGN KEY (`CLINICA_ID`) REFERENCES `clinica`  (`ID`);
ALTER TABLE `paciente` ADD FOREIGN KEY (`TUTOR_ID`)   REFERENCES `tutor`    (`ID`);

-- Atributos multivaluados del paciente
ALTER TABLE `paciente_funcion_zootecnica`  ADD FOREIGN KEY (`PACIENTE_ID`) REFERENCES `paciente` (`ID`);
ALTER TABLE `paciente_tatuaje`             ADD FOREIGN KEY (`PACIENTE_ID`) REFERENCES `paciente` (`ID`);
ALTER TABLE `paciente_esquema_preventivo`  ADD FOREIGN KEY (`PACIENTE_ID`) REFERENCES `paciente` (`ID`);
ALTER TABLE `vacuna`                       ADD FOREIGN KEY (`PACIENTE_ID`) REFERENCES `paciente` (`ID`);

-- Expediente
ALTER TABLE `expediente` ADD FOREIGN KEY (`PACIENTE_ID`) REFERENCES `paciente` (`ID`);

-- Consulta (nodo central)
ALTER TABLE `consulta` ADD FOREIGN KEY (`PACIENTE_ID`)   REFERENCES `paciente`   (`ID`);
ALTER TABLE `consulta` ADD FOREIGN KEY (`EXPEDIENTE_ID`) REFERENCES `expediente` (`ID`);
ALTER TABLE `consulta` ADD FOREIGN KEY (`EMPLEADO_ID`)   REFERENCES `empleado`   (`ID`);

-- Diagnóstico y Tratamiento → Consulta
ALTER TABLE `diagnostico` ADD FOREIGN KEY (`CONSULTA_ID`) REFERENCES `consulta` (`ID`);
ALTER TABLE `tratamiento` ADD FOREIGN KEY (`CONSULTA_ID`) REFERENCES `consulta` (`ID`);

-- Receta → Consulta
ALTER TABLE `receta`      ADD FOREIGN KEY (`CONSULTA_ID`) REFERENCES `consulta` (`ID`);
ALTER TABLE `receta`      ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado` (`ID`);
ALTER TABLE `receta_item` ADD FOREIGN KEY (`RECETA_ID`)   REFERENCES `receta`   (`ID`);

-- Orden de Cirugía → Consulta → Cirugía
ALTER TABLE `orden_cirugia` ADD FOREIGN KEY (`CONSULTA_ID`) REFERENCES `consulta` (`ID`);
ALTER TABLE `orden_cirugia` ADD FOREIGN KEY (`PACIENTE_ID`) REFERENCES `paciente` (`ID`);
ALTER TABLE `orden_cirugia` ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado` (`ID`);

ALTER TABLE `cirugia` ADD FOREIGN KEY (`ORDEN_CIRUGIA_ID`) REFERENCES `orden_cirugia` (`ID`);
ALTER TABLE `cirugia` ADD FOREIGN KEY (`PACIENTE_ID`)      REFERENCES `paciente`      (`ID`);

ALTER TABLE `cirugia_empleado` ADD FOREIGN KEY (`CIRUGIA_ID`)  REFERENCES `cirugia`  (`ID`);
ALTER TABLE `cirugia_empleado` ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado` (`ID`);

ALTER TABLE `anestesia` ADD FOREIGN KEY (`CIRUGIA_ID`) REFERENCES `cirugia` (`ID`);

-- Hospitalización → Paciente
ALTER TABLE `hospitalizacion` ADD FOREIGN KEY (`PACIENTE_ID`)  REFERENCES `paciente`  (`ID`);
ALTER TABLE `hospitalizacion` ADD FOREIGN KEY (`CONSULTA_ID`)  REFERENCES `consulta`  (`ID`);

ALTER TABLE `hospitalizacion_empleado` ADD FOREIGN KEY (`HOSPITALIZACION_ID`) REFERENCES `hospitalizacion` (`ID`);
ALTER TABLE `hospitalizacion_empleado` ADD FOREIGN KEY (`EMPLEADO_ID`)        REFERENCES `empleado`        (`ID`);

ALTER TABLE `seguimiento_hospitalizacion` ADD FOREIGN KEY (`HOSPITALIZACION_ID`) REFERENCES `hospitalizacion` (`ID`);
ALTER TABLE `alta`                        ADD FOREIGN KEY (`HOSPITALIZACION_ID`) REFERENCES `hospitalizacion` (`ID`);

-- Inventario y Servicios
ALTER TABLE `inventario`               ADD FOREIGN KEY (`CLINICA_ID`)  REFERENCES `clinica`          (`ID`);
ALTER TABLE `solicitud_reabastecimiento` ADD FOREIGN KEY (`CLINICA_ID`)  REFERENCES `clinica`          (`ID`);
ALTER TABLE `solicitud_reabastecimiento` ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado`         (`ID`);
ALTER TABLE `solicitud_reabastecimiento` ADD FOREIGN KEY (`PRODUCTO_ID`) REFERENCES `inventario`       (`ID`);

ALTER TABLE `servicio_catalogo`        ADD FOREIGN KEY (`CLINICA_ID`)  REFERENCES `clinica`          (`ID`);
ALTER TABLE `servicio_historial_precio` ADD FOREIGN KEY (`SERVICIO_ID`) REFERENCES `servicio_catalogo` (`ID`);
ALTER TABLE `servicio_historial_precio` ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado`         (`ID`);

-- Recibo
ALTER TABLE `recibo`      ADD FOREIGN KEY (`CLINICA_ID`)  REFERENCES `clinica`          (`ID`);
ALTER TABLE `recibo`      ADD FOREIGN KEY (`CONSULTA_ID`) REFERENCES `consulta`         (`ID`);
ALTER TABLE `recibo`      ADD FOREIGN KEY (`PACIENTE_ID`) REFERENCES `paciente`         (`ID`);
ALTER TABLE `recibo`      ADD FOREIGN KEY (`EMPLEADO_ID`) REFERENCES `empleado`         (`ID`);
ALTER TABLE `recibo_item` ADD FOREIGN KEY (`RECIBO_ID`)   REFERENCES `recibo`           (`ID`);
ALTER TABLE `recibo_item` ADD FOREIGN KEY (`SERVICIO_ID`) REFERENCES `servicio_catalogo` (`ID`);
ALTER TABLE `receta_item` ADD FOREIGN KEY (`MEDICAMENTO`) REFERENCES `catalogo_medicamentos` (`NOMBRE`);
ALTER TABLE `tratamiento` ADD FOREIGN KEY (`MEDICAMENTO`) REFERENCES `catalogo_medicamentos` (`NOMBRE`);
ALTER TABLE `diagnostico` ADD FOREIGN KEY (`TIPO`) REFERENCES `catalogo_toxicologia` (`TOXINA`);