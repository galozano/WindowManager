/**
 * Created by gal on 9/7/14.
 */
(function()
{
    var estados = ["Pendiente","En Progreso", "Terminado"];

    var equiposData = ""

    var app = angular.module("myAPP",["xeditable"]);

    app.run(function(editableOptions,$http,$log) {
        editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
    });

    app.controller("FirstController", function($http,$log,$scope) {

        this.equipos = equiposData;
        this.estados = estados;
        var control = this;

        //---------------------------------------------------------------------------
        // Metodos de Inicio
        //---------------------------------------------------------------------------

        //Actualizar la informacion que se encuentra en el servidor
        $http.get('/data').success(function(data)
        {
            $log.log("Informacion que llego del servidor:" + JSON.stringify(data));
            control.equipos = data;
        });

        //---------------------------------------------------------------------------
        // Metodos de Proyectos
        //---------------------------------------------------------------------------

        this.agregarProyecto = function(proyectoNuevo,nombreEquipo){

            $log.log("Agregar Proyecto: " + proyectoNuevo + "-" + nombreEquipo);

            //Poner el formulario vacio
            this.proyectoNuevo[nombreEquipo] = "";

            $log.log(control.equipos.listaEquipos);

            var keyOb = findObject(control.equipos.listaEquipos, function(num) {
                return num.nombre === nombreEquipo;
            });

            //Se agrega el proyecto al equipo
            control.equipos.listaEquipos[keyOb].proyectos.push({
                    "nombreProyecto":proyectoNuevo.nombre,
                    "descripcion":proyectoNuevo.descripcion,
                    "prioridad":1
                }
            );
        };

        this.borrarProyecto = function(nombreProyecto,nombreEquipo)
        {
            $log.log("Borrar Proyecto: " + nombreProyecto + "-" + nombreEquipo);

            var keyOb = findObject(control.equipos.listaEquipos, function(num)
            {
                return num.nombre === nombreEquipo;
            });

            $log.log("Key del Equipo: " + keyOb);

            var keyOb2 = findObject(control.equipos.listaEquipos[keyOb].proyectos,function(num)
            {
                return num.nombreProyecto === nombreProyecto;
            });

            $log.log("Key del Proyecto: " + keyOb2);
            control.equipos.listaEquipos[keyOb].proyectos.splice(keyOb2,1);
        };

        //---------------------------------------------------------------------------
        // Metodos de Sprint
        //---------------------------------------------------------------------------

        this.agregarSprint = function(sprintNuevo,nombreEquipo)
        {
            $log.log("Agregar Sprint: " + JSON.stringify(sprintNuevo));

            var keyOb = findObject(control.equipos.listaEquipos, function(num)
            {
                return num.nombre === nombreEquipo;
            });

            control.equipos.listaEquipos[keyOb].sprints.push(sprintNuevo);

            this.sprintNuevo[nombreEquipo] = "";

        };

        //---------------------------------------------------------------------------
        // Metodos de Equipos
        //---------------------------------------------------------------------------

        this.agregarEquipo = function(equipo)
        {
            $log.log("Agregar Equipo: " + JSON.stringify(equipo));

            $log.log(control.equipos);
            control.equipos.listaEquipos.push({'nombre':equipo.nombre,'proyectos': [ ],'sprints': [ ]});

            $log.log(control.equipos);
        };


        this.save = function()
        {
            $log.log("Guardar toda la informacion");

            $http.post('/save',control.equipos).success(function(data)
            {
                $log.log("OK!");

            });
        };

    });
})();

//---------------------------------------------------------------------------
// Helpers
//---------------------------------------------------------------------------

function findObject(listArray,callback)
{
    for(var key in listArray) {

        var object = listArray[key];

        if(callback(object))
        {
            return key;
        }
    }
}

