using System;
using Symbol.RFID.SDK;
using Symbol.RFID.SDK.Reader;

class Program
{
    static void Main(string[] args)
    {
        try
        {
            Console.WriteLine("Iniciando escaneo de RFID...");
            RFIDReader reader = new RFIDReader();
            reader.ReaderEvent += Reader_ReaderEvent;
            reader.StartScan();
            
            Console.WriteLine("Escaneando, presione Enter para salir...");
            Console.ReadLine();

            reader.StopScan();
            reader.ReaderEvent -= Reader_ReaderEvent;
            Console.WriteLine("Escaneo detenido.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al iniciar el escáner: {ex.Message}");
        }
    }

    private static void Reader_ReaderEvent(object sender, ReaderEventArgs e)
    {
        if (e.ReaderEventType == ReaderEventType.EvtRead)
        {
            Console.WriteLine($"Etiqueta escaneada: {e.TagID}");
            // Aquí puedes agregar la lógica para comparar la etiqueta con el inventario
        }
    }
}
