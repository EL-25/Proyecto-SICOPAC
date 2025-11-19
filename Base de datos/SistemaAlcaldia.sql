-- 1. Crear base de datos
CREATE DATABASE SistemaAlcaldia;
GO

-- 2. Usar la base recién creada
USE SistemaAlcaldia;
GO

-- 3. Crear tabla Usuarios
CREATE TABLE Usuarios (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Usuario NVARCHAR(50) NOT NULL UNIQUE,
  Clave NVARCHAR(255) NOT NULL, -- Contraseña cifrada
  NombreCompleto NVARCHAR(100) NOT NULL,
  Rol NVARCHAR(50) DEFAULT 'Administrador',
  Estado BIT DEFAULT 1, -- 1 = activo, 0 = inactivo
  FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

-- 4. Crear tabla Formularios
CREATE TABLE Formularios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NumeroFormulario AS (FORMAT(Id, '00000')),
    
    NombreSolicitante NVARCHAR(150) NOT NULL,
    Municipio NVARCHAR(100) NOT NULL,
    Distrito NVARCHAR(100) NOT NULL,
    FechaPresentacion DATE NOT NULL,
    HoraPresentacion TIME NULL,
    Telefono NVARCHAR(20) NULL,
    Correo NVARCHAR(120) NULL,
    Declaraciones NVARCHAR(MAX) NULL,
    DescripcionDocumentacion NVARCHAR(MAX) NULL,
    
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO


-- 5. Insertar usuario inicial
INSERT INTO Usuarios (Usuario, Clave, NombreCompleto, Rol, Estado)
VALUES ('Edwin Leiva', 'Admin2421', 'Administrador de la Base de Datos', 'Administrador', 1);
GO

-- 6. Crear login y usuario con permisos
CREATE LOGIN DATABASEUDBEDWIN WITH PASSWORD = 'EdwinBD31';
GO

CREATE USER UDBbasedatos FOR LOGIN DATABASEUDBEDWIN;
GO

ALTER ROLE db_owner ADD MEMBER UDBbasedatos;
GO

-- 7. Añadir columnas adicionales
ALTER TABLE Usuarios ADD Correo NVARCHAR(100);
ALTER TABLE Usuarios ADD Firma VARCHAR(100);
GO

-- 8. Actualizar datos del usuario
UPDATE Usuarios
SET Correo = 'edwin.leiva@lalibertad.gob.sv',
    NombreCompleto = 'Edwin Daniel Leiva Barrera',
    Rol = 'Administrador de la Base de Datos',
    Firma = 'Firma EL.png'
WHERE Usuario = 'Edwin Leiva';
GO

-- 9. Limpiar tabla y reseed
DELETE FROM Usuarios WHERE Id <> 1;
GO

DBCC CHECKIDENT ('Usuarios', RESEED, 1);
GO

--10. Limpiar tabla Formularios

-- Elimina todos los registros
DELETE FROM Formularios;

-- Reinicia el contador de identidad (Id) a 1
DBCC CHECKIDENT ('Formularios', RESEED, 0);
